import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { QuestionWithOptions, CheckInState, SubmittedSignal } from '../types/mirar';
import { getCycleDay, getStageFromDay } from '../lib/scoring';

interface CheckInStore extends CheckInState {
  loadTodayQuestion: (cycleId: string, cycleStartDate: string) => Promise<void>;
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

  loadTodayQuestion: async (cycleId: string, cycleStartDate: string) => {
    const dayNumber = getCycleDay(cycleStartDate);
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Check if already completed today
    if (userId) {
      const { data: existing } = await supabase
        .from('responses')
        .select('option_id, submitted_at, question_id')
        .eq('user_id', userId)
        .eq('cycle_id', cycleId)
        .eq('day_number', dayNumber)
        .maybeSingle();

      if (existing) {
        const { data: question } = await supabase
          .from('questions')
          .select('*, options(*)')
          .eq('id', existing.question_id)
          .single();

        if (question) {
          question.options = (question.options ?? []).sort(
            (a: any, b: any) => a.option_number - b.option_number
          );
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
    }

    // Adaptive question selection via edge function
    try {
      const { data, error } = await supabase.functions.invoke('select-daily-question', {
        body: { user_id: userId, cycle_id: cycleId, current_day: dayNumber },
      });

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
      const stage = getStageFromDay(dayNumber);
      const affinityMap: Record<number, string> = {
        1: 'awareness', 2: 'realignment', 3: 'action', 4: 'reflection',
      };
      const { data: question } = await supabase
        .from('questions')
        .select('*, options(*)')
        .eq('active', true)
        .in('stage_affinity', [affinityMap[stage], 'any'])
        .limit(1)
        .single();

      if (question) {
        question.options = (question.options ?? []).sort(
          (a: any, b: any) => a.option_number - b.option_number
        );
        set({
          question: question as QuestionWithOptions,
          questionId: question.id,
          isCompleted: false,
          completedOptionId: null,
          completedAt: null,
        });
      }
    }
  },

  selectOption: (optionId: string) => set({ selectedOptionId: optionId }),

  setJournalText: (text: string) => set({ journalText: text }),

  submitCheckIn: async (userId: string, cycleId: string) => {
    const { question, selectedOptionId, journalText } = get();
    if (!question || !selectedOptionId) return { error: 'No option selected' };

    set({ isSubmitting: true });

    const { data: cycleData } = await supabase
      .from('cycles')
      .select('start_date')
      .eq('id', cycleId)
      .single();

    if (!cycleData?.start_date) {
      set({ isSubmitting: false });
      return { error: 'Cycle not found' };
    }

    const dayNumber = getCycleDay(cycleData.start_date);

    // Capture score before submission for delta display
    const today = new Date().toISOString().split('T')[0];
    const { data: prevScore } = await supabase
      .from('alignment_scores')
      .select('score')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
    const scoreBefore = prevScore?.score ?? null;

    // Find the selected option for signal breakdown
    const selectedOption = question.options.find((o) => o.id === selectedOptionId);

    try {
      const { data, error } = await supabase.functions.invoke('process-checkin', {
        body: {
          user_id: userId,
          cycle_id: cycleId,
          question_id: question.id,
          option_id: selectedOptionId,
          day_number: dayNumber,
          journal_text: journalText.trim() || null,
        },
      });

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
        isSubmitting: false,
        isCompleted: true,
        completedOptionId: selectedOptionId,
        completedAt: new Date().toISOString(),
        submittedSignal,
      });

      return { error: null, alignmentScore: scoreAfter, scoreBefore };
    } catch {
      // Fallback: direct insert
      const { error: insertError } = await supabase.from('responses').upsert({
        user_id: userId,
        cycle_id: cycleId,
        question_id: question.id,
        option_id: selectedOptionId,
        day_number: dayNumber,
        journal_text: journalText.trim() || null,
      }, { onConflict: 'user_id,cycle_id,day_number' });

      set({ isSubmitting: false });
      if (insertError) return { error: insertError.message };

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
  },

  reset: () => set(defaultState),
}));
