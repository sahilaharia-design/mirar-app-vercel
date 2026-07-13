import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { CycleRow, StageOverview, ThemeScore, AlignmentScoreRow, ThemeCode } from '../types/mirar';
import {
  getCycleDay,
  getElapsedCycleDay,
  getStageFromDay,
  getStageDayRange,
  getStageCoverage,
  computeThemeScores,
  computeThemeHistories,
  computeStreak,
} from '../lib/scoring';
import { STAGES, THEME_ORDER, THEMES } from '../lib/constants';
import { computePatternReading, PatternReading } from '../lib/patterns';

interface CycleStore {
  activeCycle: CycleRow | null;
  currentDay: number;
  currentStage: number;
  stageOverviews: StageOverview[];
  alignmentScore: AlignmentScoreRow | null;
  alignmentHistory: AlignmentScoreRow[]; // last 14 days for sparkline
  rollingThemeScores: ThemeScore[];

  // ── user_state derived fields ──────────────────────────────────────────────
  streakLength: number;
  contextMessage: string | null;
  latestSignalText: string | null;
  totalReflections: number;
  themeHistories: Record<ThemeCode, { day: number; average: number | null }[]> | null;

  // ── Pattern engine output: signals → patterns → awareness ─────────────────
  patternReading: PatternReading | null;

  isLoading: boolean;

  loadActiveCycle: (userId: string) => Promise<void>;
  loadAlignmentScore: (userId: string) => Promise<void>;
  loadAlignmentHistory: (userId: string, days?: number) => Promise<void>;
  refreshScores: () => Promise<void>;
}

export const useCycleStore = create<CycleStore>((set, get) => ({
  activeCycle: null,
  currentDay: 1,
  currentStage: 1,
  stageOverviews: [],
  alignmentScore: null,
  alignmentHistory: [],
  rollingThemeScores: [],

  // user_state fields (default values)
  streakLength: 0,
  contextMessage: null,
  latestSignalText: null,
  totalReflections: 0,
  themeHistories: null,
  patternReading: null,

  isLoading: false,

  loadActiveCycle: async (userId: string) => {
    set({ isLoading: true });

    const { data: cycle } = await supabase
      .from('cycles')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('cycle_number', { ascending: false })
      .limit(1)
      .single();

    if (!cycle) {
      set({ isLoading: false });
      return;
    }

    const elapsedDay = getElapsedCycleDay(cycle.start_date);

    // Mirar is a continuous practice, not a 28-day program — when a cycle's
    // window has fully elapsed, roll over to the next one silently. No gate,
    // no ceremony; the user experiences day 29 exactly like day 28.
    if (elapsedDay > 28) {
      const now = new Date().toISOString();
      const newCycleNumber = cycle.cycle_number + 1;

      await supabase.from('cycles').update({ status: 'completed' }).eq('id', cycle.id);

      const { data: newCycle } = await supabase
        .from('cycles')
        .insert({
          user_id: userId,
          cycle_number: newCycleNumber,
          start_date: now,
          stage1_start: now,
          status: 'active',
        })
        .select()
        .single();

      await supabase
        .from('users')
        .update({ current_cycle: newCycleNumber, cycle_start_date: now })
        .eq('id', userId);

      if (newCycle) {
        return get().loadActiveCycle(userId);
      }
    }

    const currentDay = getCycleDay(cycle.start_date);
    const currentStage = getStageFromDay(currentDay);

    // Load all responses for this cycle
    const { data: responses = [] } = await supabase
      .from('responses')
      .select('*')
      .eq('user_id', userId)
      .eq('cycle_id', cycle.id);

    // Load all options for scoring
    const optionIds = (responses ?? []).map((r: any) => r.option_id);
    let optionsMap: Record<string, any> = {};
    if (optionIds.length > 0) {
      const { data: options = [] } = await supabase
        .from('options')
        .select('*')
        .in('id', optionIds);
      for (const opt of options ?? []) {
        optionsMap[opt.id] = opt;
      }
    }

    // Load reports for this cycle
    const { data: reports = [] } = await supabase
      .from('reports')
      .select('id, stage, status')
      .eq('cycle_id', cycle.id);

    const reportsByStage: Record<number, any> = {};
    for (const r of reports ?? []) {
      reportsByStage[r.stage] = r;
    }

    // Build stage overviews
    const stageOverviews: StageOverview[] = STAGES.map((stageDef) => {
      const stage = stageDef.number;
      const [startDay, endDay] = stageDef.days;
      const stageResponses = (responses ?? []).filter(
        (r: any) => r.day_number >= startDay && r.day_number <= endDay
      );
      const themeScores: ThemeScore[] = computeThemeScores(stageResponses, optionsMap);
      const coverage = stageResponses.length;

      const report = reportsByStage[stage];
      let stageStatus: StageOverview['status'] = 'WAITING';
      if (report?.status === 'generated' || report?.status === 'delivered') {
        stageStatus = 'GENERATED';
      } else if (elapsedDay >= endDay + 1) {
        // Use unclamped elapsed day so stage 4 (days 22–28) becomes DUE on day 29+
        stageStatus = 'DUE';
      } else if (currentStage >= stage) {
        stageStatus = 'WAITING';
      }

      // Compute stage start date
      const stageStartDate = new Date(cycle.start_date);
      stageStartDate.setDate(stageStartDate.getDate() + startDay - 1);

      return {
        stage,
        label: stageDef.label,
        description: stageDef.description,
        dayRange: stageDef.days,
        startDate: stageStartDate.toISOString(),
        coverage,
        status: stageStatus,
        themeScores,
        reportId: report?.id ?? null,
        reportStatus: report?.status ?? null,
      };
    });

    // Rolling 7-day theme scores (client-side computation)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentResponses = (responses ?? []).filter(
      (r: any) => new Date(r.submitted_at) >= sevenDaysAgo
    );
    const rollingThemeScores = computeThemeScores(recentResponses, optionsMap);

    // Per-theme 7-day trend histories
    const themeHistories = computeThemeHistories(
      responses ?? [],
      optionsMap,
      currentDay,
      7
    );

    // Streak from responses
    const streakLength = computeStreak(responses ?? [], currentDay);

    // Pattern engine: signals → patterns → awareness
    const patternReading = computePatternReading(responses ?? [], optionsMap, currentDay);

    set({
      activeCycle: cycle,
      currentDay,
      currentStage,
      stageOverviews,
      rollingThemeScores,
      themeHistories,
      streakLength,
      patternReading,
      isLoading: false,
    });

    // Load today's alignment score + user_state in parallel
    get().loadAlignmentScore(userId);
    loadUserState(userId, set);

    // Self-heal: generate any reports whose stage window has passed but which
    // never got created (the day-8/15/22 trigger only fires if the user checks
    // in on exactly that day, and day 29 was previously unreachable).
    ensureReportsGenerated(userId, cycle.id, stageOverviews, () =>
      get().loadActiveCycle(userId)
    );
  },

  loadAlignmentScore: async (userId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('alignment_scores')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();
    set({ alignmentScore: data ?? null });
  },

  loadAlignmentHistory: async (userId: string, days = 14) => {
    const since = new Date();
    since.setDate(since.getDate() - days + 1);
    const sinceStr = since.toISOString().split('T')[0];
    const { data } = await supabase
      .from('alignment_scores')
      .select('*')
      .eq('user_id', userId)
      .gte('date', sinceStr)
      .order('date', { ascending: true });
    set({ alignmentHistory: data ?? [] });
  },

  refreshScores: async () => {
    const { activeCycle } = get();
    if (!activeCycle) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (user) {
      await get().loadActiveCycle(user.id);
    }
  },
}));

// ── Ensure overdue reports exist ────────────────────────────────────────────
// For every stage whose window has fully passed with at least one reflection
// but no generated report, invoke the generate-report edge function, then
// reload once so the Reports tab reflects the new state. Guarded so each
// cycle only attempts generation once per app session.
const reportGenerationAttempted = new Set<string>();

async function ensureReportsGenerated(
  userId: string,
  cycleId: string,
  stageOverviews: StageOverview[],
  reload: () => Promise<void>
) {
  if (reportGenerationAttempted.has(cycleId)) return;

  const missing = stageOverviews.filter(
    (s) => s.status === 'DUE' && s.coverage > 0 && !s.reportId
  );
  if (missing.length === 0) return;

  reportGenerationAttempted.add(cycleId);

  const results = await Promise.allSettled(
    missing.map((s) =>
      supabase.functions.invoke('generate-report', {
        body: { user_id: userId, cycle_id: cycleId, stage: s.stage },
      })
    )
  );

  const anySucceeded = results.some(
    (r) => r.status === 'fulfilled' && !(r.value as any)?.error
  );
  if (anySucceeded) {
    await reload();
  }
}

// ── Load user_state (contextMessage, latestSignalText) ─────────────────────────
// Called as a fire-and-forget from loadActiveCycle — updates store when ready.
async function loadUserState(
  userId: string,
  set: (partial: Partial<CycleStore>) => void
) {
  const { data } = await supabase
    .from('user_state')
    .select('streak_length, context_message, latest_signal_text, total_reflections')
    .eq('user_id', userId)
    .maybeSingle();

  if (data) {
    set({
      // Prefer DB streak (computed server-side) if non-zero; else keep client-computed
      streakLength: data.streak_length ?? 0,
      contextMessage: data.context_message ?? null,
      latestSignalText: data.latest_signal_text ?? null,
      totalReflections: data.total_reflections ?? 0,
    });
  }
}
