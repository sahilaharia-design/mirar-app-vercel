import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { QuestionWithOptions, CheckInState, SubmittedSignal } from '../types/mirar';
import { getCycleDay, getStageFromDay, hasCheckedInToday } from '../lib/scoring';
import { withTimeout } from '../lib/with-timeout';
import i18n from '../lib/i18n';

// The select-daily-question edge function already returns text localized to
// the user's language (with English fallback). These two direct-query paths
// (already-answered-today, and the offline fallback when the edge function
// itself is unreachable) read the same table directly, so they need the same
// resolution — otherwise a Hindi/Gujarati user would see raw English here
// even though the normal path is fully localized.
const QUESTION_LOCALIZED_FIELDS = ['prompt_text', 'tomorrow_tease', 'mirror_glimmer', 'journal_prompt', 'pole_low_label', 'pole_high_label'] as const;
const OPTION_LOCALIZED_FIELDS = ['option_text'] as const;

function localize(row: Record<string, any>, fields: readonly string[]): Record<string, any> {
  const language = i18n.language;
  if (!row || language === 'en') return row;
  for (const field of fields) {
    const localized = row[`${field}_${language}`];
    if (typeof localized === 'string' && localized.trim().length > 0) {
      row[field] = localized;
    }
  }
  return row;
}

function localizeQuestion(question: any): any {
  if (!question) return question;
  localize(question, QUESTION_LOCALIZED_FIELDS);
  question.options = (question.options ?? []).map((opt: any) => localize(opt, OPTION_LOCALIZED_FIELDS));
  return question;
}

interface CheckInStore extends CheckInState {
  // `dayNumber` is the caller's already-computed getCycleDay(completedCount)
  // — the next undone day. "Already completed today" is decided separately,
  // in here, via hasCheckedInToday against actual submitted_at dates.
  loadTodayQuestion: (cycleId: string, dayNumber: number) => Promise<void>;
  selectOption: (optionId: string) => void;
  setJournalText: (text: string) => void;
  submitCheckIn: (userId: string, cycleId: string) => Promise<{ error: string | null; alignmentScore?: number | null; scoreBefore?: number | null }>;
  reset: () => void;
}

const defaultState: CheckInState = {
  questionId: null,
  question: null,
  selectedOptionId: null,
  journalText: '',
  isSubmitting: false,
  isCompleted: false,
  completedOptionId: null,
  completedAt: null,
  submittedSignal: null,
};

export const useCheckInStore = create<CheckInStore>((set, get) => ({
  ...defaultState,

  loadTodayQuestion: async (cycleId: string, dayNumber: number) => {
    let userId: string | undefined;
    try {
      const { data: { user } } = await withTimeout(supabase.auth.getUser());
      userId = user?.id;
    } catch {
      // Can't resolve the user right now — fall through to the adaptive
      // question path below rather than hanging here indefinitely.
    }

    // Check if already completed today. This is a genuinely separate,
    // calendar-based question from "what's the next day_number" (dayNumber,
    // passed in by the caller) — see hasCheckedInToday in lib/scoring.ts.
    // day_number can no longer be used to look this up directly since it's
    // now just a completion counter, not tied to any specific calendar day.
    if (userId) {
      try {
        const { data: recent } = await withTimeout(
          supabase
            .from('responses')
            .select('option_id, submitted_at, question_id')
            .eq('user_id', userId)
            .eq('cycle_id', cycleId)
            .order('submitted_at', { ascending: false })
            .limit(5)
        );

        const existing = (recent ?? []).find((r: any) => hasCheckedInToday([r]));

        if (existing) {
          const { data: question } = await withTimeout(
            supabase.from('questions').select('*, options(*)').eq('id', existing.question_id).single()
          );

          if (question) {
            question.options = (question.options ?? []).sort(
              (a: any, b: any) => a.option_number - b.option_number
            );
            localizeQuestion(question);
            set({
              question: question as QuestionWithOptions,
              questionId: question.id,
              isCompleted: true,
              completedOptionId: existing.option_id,
              completedAt: existing.submitted_at,
            });
          }
          return;
        }
      } catch {
        // Couldn't check completion state — fall through to load a fresh
        // question rather than leaving the screen stuck loading.
      }
    }

    // Adaptive question selection via edge function
    try {
      const { data, error } = await withTimeout(
        supabase.functions.invoke('select-daily-question', {
          body: { user_id: userId, cycle_id: cycleId, current_day: dayNumber },
        })
      );

      if (error || !data?.question) throw new Error(error?.message ?? 'No question');

      set({
        question: data.question as QuestionWithOptions,
        questionId: data.question.id,
        isCompleted: false,
        completedOptionId: null,
        completedAt: null,
      });
    } catch {
      // Fallback: direct query by stage affinity
      try {
        const stage = getStageFromDay(dayNumber);
        const affinityMap: Record<number, string> = {
          1: 'awareness', 2: 'realignment', 3: 'action', 4: 'reflection',
        };
        const { data: question } = await withTimeout(
          supabase
            .from('questions')
            .select('*, options(*)')
            .eq('active', true)
            .in('stage_affinity', [affinityMap[stage], 'any'])
            .limit(1)
            .single()
        );

        if (question) {
          question.options = (question.options ?? []).sort(
            (a: any, b: any) => a.option_number - b.option_number
          );
          localizeQuestion(question);
          set({
            question: question as QuestionWithOptions,
            questionId: question.id,
            isCompleted: false,
            completedOptionId: null,
            completedAt: null,
          });
        }
      } catch {
        // Both the adaptive path and the fallback query failed (e.g. no
        // network). Leave state as-is — the caller can retry via pull-to-refresh
        // rather than the screen hanging forever with no recourse.
      }
    }
  },

  selectOption: (optionId: string) => set({ selectedOptionId: optionId }),

  setJournalText: (text: string) => set({ journalText: text }),

  submitCheckIn: async (userId: string, cycleId: string) => {
    const { question, selectedOptionId, journalText } = get();
    if (!question || !selectedOptionId) return { error: 'No option selected' };

    set({ isSubmitting: true });

    // Everything below is wrapped so isSubmitting ALWAYS resets, no matter
    // which call fails, times out, or throws — the submit button must never
    // stay stuck showing "Recording…" indefinitely.
    try {
      // Fetch a fresh, authoritative completed-count right before computing
      // the day number this submission gets — same "don't trust cached
      // client state" reasoning as before, just pointed at the response
      // count now instead of cycle.start_date (day_number no longer derives
      // from calendar time at all — see getCycleDay in lib/scoring.ts).
      let completedCount: number;
      try {
        const { count, error: countErr } = await withTimeout(
          supabase
            .from('responses')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('cycle_id', cycleId)
        );
        if (countErr) throw countErr;
        completedCount = count ?? 0;
      } catch (err) {
        return { error: err instanceof Error ? err.message : 'Could not reach the server. Please try again.' };
      }

      const dayNumber = getCycleDay(completedCount);

      // Capture score before submission for delta display. Best-effort only —
      // a failure here shouldn't block the actual check-in submission.
      const today = new Date().toISOString().split('T')[0];
      let scoreBefore: number | null = null;
      try {
        const { data: prevScore } = await withTimeout(
          supabase.from('alignment_scores').select('score').eq('user_id', userId).eq('date', today).maybeSingle()
        );
        scoreBefore = prevScore?.score ?? null;
      } catch {
        scoreBefore = null;
      }

      // Find the selected option for signal breakdown
      const selectedOption = question.options.find((o) => o.id === selectedOptionId);

      try {
        const { data, error } = await withTimeout(
          supabase.functions.invoke('process-checkin', {
            body: {
              user_id: userId,
              cycle_id: cycleId,
              question_id: question.id,
              option_id: selectedOptionId,
              day_number: dayNumber,
              journal_text: journalText.trim() || null,
            },
          })
        );

        if (error) throw new Error(error.message);

        const scoreAfter = data?.alignmentScore ?? null;

        const submittedSignal: SubmittedSignal | null = selectedOption ? {
          theme1Code: selectedOption.theme_1_code,
          theme1Level: selectedOption.theme_1_level,
          theme2Code: selectedOption.theme_2_code,
          theme2Level: selectedOption.theme_2_level,
          scoreBefore,
          scoreAfter,
          tomorrowTease: question.tomorrow_tease ?? null,
          theme1PatternFlag: data?.theme1PatternFlag ?? null,
          theme2PatternFlag: data?.theme2PatternFlag ?? null,
        } : null;

        set({
          isCompleted: true,
          completedOptionId: selectedOptionId,
          completedAt: new Date().toISOString(),
          submittedSignal,
        });

        return { error: null, alignmentScore: scoreAfter, scoreBefore };
      } catch {
        // Fallback: direct insert
        try {
          const { error: insertError } = await withTimeout(
            supabase.from('responses').upsert({
              user_id: userId,
              cycle_id: cycleId,
              question_id: question.id,
              option_id: selectedOptionId,
              day_number: dayNumber,
              journal_text: journalText.trim() || null,
            }, { onConflict: 'user_id,cycle_id,day_number' })
          );

          if (insertError) return { error: insertError.message };
        } catch (err) {
          return { error: err instanceof Error ? err.message : 'Could not reach the server. Please try again.' };
        }

        const submittedSignal: SubmittedSignal | null = selectedOption ? {
          theme1Code: selectedOption.theme_1_code,
          theme1Level: selectedOption.theme_1_level,
          theme2Code: selectedOption.theme_2_code,
          theme2Level: selectedOption.theme_2_level,
          scoreBefore,
          scoreAfter: null,
          tomorrowTease: question.tomorrow_tease ?? null,
          theme1PatternFlag: null,
          theme2PatternFlag: null,
        } : null;

        set({
          isCompleted: true,
          completedOptionId: selectedOptionId,
          completedAt: new Date().toISOString(),
          submittedSignal,
        });

        return { error: null, scoreBefore };
      }
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Something went wrong. Please try again.' };
    } finally {
      set({ isSubmitting: false });
    }
  },

  reset: () => set(defaultState),
}));
