import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Alert,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../stores/auth-store';
import { useCycleStore } from '../../stores/cycle-store';
import { seedCheckIns, resetCycle, forceGenerateReport, SeedPattern } from '../../lib/dev-seed';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

type TaskStatus = 'idle' | 'running' | 'done' | 'error';

interface Task {
  label: string;
  status: TaskStatus;
  message?: string;
}

const SEED_OPTIONS: { label: string; days: number; pattern: SeedPattern }[] = [
  { label: 'Seed 3 days (realistic)', days: 3, pattern: 'realistic' },
  { label: 'Seed 7 days (realistic)', days: 7, pattern: 'realistic' },
  { label: 'Seed 7 days (aligned)', days: 7, pattern: 'aligned' },
  { label: 'Seed 7 days (under load)', days: 7, pattern: 'under_load' },
  { label: 'Seed 14 days (mixed)', days: 14, pattern: 'mixed' },
  { label: 'Seed full cycle (28 days)', days: 28, pattern: 'realistic' },
];

export default function DevTestPanel() {
  const { session } = useAuthStore();
  const { activeCycle, currentDay, loadActiveCycle } = useCycleStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [busy, setBusy] = useState(false);

  const userId = session?.user?.id;
  const cycleId = activeCycle?.id;

  // Load cycle on mount so context shows even when navigating directly to this screen
  useEffect(() => {
    if (userId) loadActiveCycle(userId);
  }, [userId]);

  const addTask = (label: string): number => {
    const idx = tasks.length;
    setTasks((prev) => [...prev, { label, status: 'running' }]);
    return idx;
  };

  const updateTask = (idx: number, status: TaskStatus, message?: string) => {
    setTasks((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, status, message } : t))
    );
  };

  const run = async (fn: () => Promise<void>) => {
    if (busy || !userId || !cycleId) return;
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
      // Refresh cycle store so home screen updates
      if (userId) loadActiveCycle(userId);
    }
  };

  const handleSeed = (days: number, pattern: SeedPattern) => {
    run(async () => {
      const label = `Seed ${days} days (${pattern})`;
      const idx = addTask(label);
      const result = await seedCheckIns(userId!, cycleId!, days, pattern);
      if (result.errors.length > 0) {
        updateTask(idx, 'error', `${result.seeded} seeded — ${result.errors[0]}`);
      } else {
        updateTask(idx, 'done', `${result.seeded} check-ins seeded`);
      }
    });
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Cycle',
      'This will delete ALL responses, scores, and reports for the active cycle. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () =>
            run(async () => {
              const idx = addTask('Reset active cycle');
              const result = await resetCycle(userId!, cycleId!);
              updateTask(idx, result.error ? 'error' : 'done', result.error ?? 'Cycle reset to Day 1');
            }),
        },
      ]
    );
  };

  const handleForceReport = (stage: number) => {
    run(async () => {
      const idx = addTask(`Generate Stage ${stage} report`);
      const result = await forceGenerateReport(userId!, cycleId!, stage);
      updateTask(idx, result.error ? 'error' : 'done', result.error ?? 'Report generated');
    });
  };

  const handleTriggerMirror = () => {
    run(async () => {
      const { supabase } = await import('../../lib/supabase');
      const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
      const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';
      const idx = addTask('Generate Haiku mirror insight');
      try {
        // Fetch theme scores and fresh token in parallel
        const [themeResult, refreshResult] = await Promise.all([
          supabase.from('theme_scores').select('theme_code, status').eq('user_id', userId).eq('cycle_id', cycleId),
          supabase.auth.refreshSession(),
        ]);

        const themeScores = themeResult.data ?? [];
        let token: string;
        if (!refreshResult.error && refreshResult.data?.session?.access_token) {
          token = refreshResult.data.session.access_token;
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          token = session?.access_token ?? SUPABASE_ANON_KEY;
        }

        const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-mirror-insight`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            user_id: userId,
            cycle_id: cycleId,
            day_number: currentDay,
            alignment_score: 65,
            theme_statuses: themeScores.map((t: any) => ({
              code: t.theme_code,
              name: t.theme_code,
              status: t.status,
            })),
            journal_snippet: null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(`HTTP ${res.status}: ${JSON.stringify(data)}`);
        updateTask(idx, 'done', data?.mirror_text ?? 'Generated — add Anthropic credits to see text');
      } catch (e: any) {
        updateTask(idx, 'error', e.message);
      }
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Dev Test Panel</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>DEV ONLY</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Context */}
        <View style={styles.contextCard}>
          <Text style={styles.contextLabel}>Active Context</Text>
          <Text style={styles.contextRow}>
            Cycle: {activeCycle?.cycle_number ?? '—'} · Day {currentDay} of 28
          </Text>
          <Text style={styles.contextRow}>
            User: {userId?.slice(0, 8) ?? '—'}…
          </Text>
          <Text style={styles.contextRow}>
            Cycle ID: {cycleId?.slice(0, 8) ?? '—'}…
          </Text>
        </View>

        {/* Seed check-ins */}
        <Section title="Seed Check-ins">
          {SEED_OPTIONS.map((opt) => (
            <DevButton
              key={opt.label}
              label={opt.label}
              onPress={() => handleSeed(opt.days, opt.pattern)}
              disabled={busy || !cycleId}
            />
          ))}
        </Section>

        {/* Force reports */}
        <Section title="Force Stage Reports">
          {[1, 2, 3, 4].map((stage) => (
            <DevButton
              key={stage}
              label={`Generate Stage ${stage} Report`}
              onPress={() => handleForceReport(stage)}
              disabled={busy || !cycleId}
              variant="accent"
            />
          ))}
        </Section>

        {/* AI Mirror */}
        <Section title="AI Mirror (Claude Haiku)">
          <DevButton
            label="Trigger Mirror Insight Now"
            onPress={handleTriggerMirror}
            disabled={busy || !cycleId}
            variant="accent"
          />
          <Text style={styles.hint}>
            Calls generate-mirror-insight and stores mirror_text on today's alignment score.
          </Text>
        </Section>

        {/* Reset */}
        <Section title="Danger Zone">
          <DevButton
            label="Reset Active Cycle (delete all data)"
            onPress={handleReset}
            disabled={busy || !cycleId}
            variant="danger"
          />
        </Section>

        {/* Task log */}
        {tasks.length > 0 && (
          <Section title="Task Log">
            {[...tasks].reverse().map((task, i) => (
              <Animated.View
                key={i}
                entering={FadeIn.duration(300)}
                style={[styles.taskRow, { borderColor: statusColor(task.status) }]}
              >
                <View style={[styles.taskDot, { backgroundColor: statusColor(task.status) }]} />
                <View style={styles.taskContent}>
                  <Text style={styles.taskLabel}>{task.label}</Text>
                  {task.message && (
                    <Text style={styles.taskMessage}>{task.message}</Text>
                  )}
                </View>
                {task.status === 'running' && (
                  <ActivityIndicator size="small" color={COLORS.slateMid} />
                )}
              </Animated.View>
            ))}
          </Section>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={sectionStyles.container}>
      <Text style={sectionStyles.title}>{title}</Text>
      <View style={sectionStyles.body}>{children}</View>
    </View>
  );
}

function DevButton({
  label,
  onPress,
  disabled,
  variant = 'default',
}: {
  label: string;
  onPress: () => void;
  disabled: boolean;
  variant?: 'default' | 'accent' | 'danger';
}) {
  const bg =
    variant === 'danger'
      ? COLORS.underLoad
      : variant === 'accent'
      ? COLORS.slate
      : COLORS.creamDark;
  const textColor =
    variant === 'danger' || variant === 'accent' ? COLORS.creamLight : COLORS.slate;

  return (
    <TouchableOpacity
      style={[btnStyles.btn, { backgroundColor: bg }, disabled && btnStyles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[btnStyles.text, { color: textColor }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function statusColor(status: TaskStatus): string {
  switch (status) {
    case 'done': return COLORS.aligned;
    case 'error': return COLORS.underLoad;
    case 'running': return COLORS.forming;
    default: return COLORS.borderLight;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.cream },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  backBtn: { marginRight: SPACING.xs },
  backText: { fontSize: FONT_SIZE.sm, color: COLORS.slateMid },
  title: { flex: 1, fontSize: FONT_SIZE.base, fontWeight: '600', color: COLORS.slate },
  badge: {
    backgroundColor: COLORS.underLoad,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  badgeText: { fontSize: 9, color: COLORS.white, fontWeight: '700', letterSpacing: 0.5 },
  scroll: { flex: 1 },
  content: { paddingHorizontal: SPACING.lg, gap: SPACING.lg },
  contextCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 3,
  },
  contextLabel: { fontSize: 10, color: COLORS.slateLight, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 },
  contextRow: { fontSize: FONT_SIZE.xs, color: COLORS.slateMid, fontFamily: 'monospace' },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderLeftWidth: 2,
    paddingLeft: SPACING.sm,
    paddingVertical: 6,
  },
  taskDot: { width: 6, height: 6, borderRadius: 3 },
  taskContent: { flex: 1 },
  taskLabel: { fontSize: FONT_SIZE.xs, color: COLORS.slate, fontWeight: '500' },
  taskMessage: { fontSize: 10, color: COLORS.slateLight, marginTop: 1 },
  hint: { fontSize: 10, color: COLORS.slateLight, lineHeight: 15 },
});

const sectionStyles = StyleSheet.create({
  container: { gap: SPACING.sm },
  title: { fontSize: 10, color: COLORS.slateLight, letterSpacing: 1, textTransform: 'uppercase' },
  body: { gap: SPACING.xs },
});

const btnStyles = StyleSheet.create({
  btn: {
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
    alignItems: 'center',
  },
  disabled: { opacity: 0.4 },
  text: { fontSize: FONT_SIZE.sm, fontWeight: '500' },
});
