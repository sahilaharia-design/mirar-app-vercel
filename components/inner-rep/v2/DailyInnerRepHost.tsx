import React, { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../stores/auth-store';
import { useInnerRepV2Store } from '../../../stores/inner-rep-v2-store';
import { DailyInnerRep } from './DailyExperience';
import { Action, Body } from './Foundation';
import { MIRAR as M } from '../../../design-system/native';
import { router } from 'expo-router';

const greetingKey = () => { const h = new Date().getHours(); return h < 12 ? 'common.greeting_morning' : h < 17 ? 'common.greeting_afternoon' : 'common.greeting_evening'; };

/** Connects the Codex presentation (DailyInnerRep) to the v2 runtime. No presentation or engine logic lives here. */
export function DailyInnerRepHost() {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.session?.user?.id);
  const { status, today, dayKey, practiceDays, receipt, load, progress, complete, discardForSafety, feedback, correction } = useInnerRepV2Store();
  // reload on focus: picks up a new calendar day without a full app restart
  useFocusEffect(useCallback(() => { if (userId) void load(userId); }, [userId, load]));

  if (status === 'error') return <View style={{ flex: 1, backgroundColor: M.color.surface, padding: M.space.lg, gap: M.space.base }}><Body>Couldn't get today ready.</Body><Action onPress={() => userId && void load(userId)}>Try again</Action></View>;
  if (!today) return <View style={{ flex: 1, backgroundColor: M.color.surface, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={M.color.muted} accessibilityLabel="Getting today ready" /></View>;
  const rep = <DailyInnerRep
    key={dayKey} // remount only on a new calendar day: rep → done keeps the presentation's own stage
    today={today} greeting={t(greetingKey())} practiceDays={practiceDays} receipt={receipt}
    draft={today.kind === 'rep' ? today.draft : undefined}
    onProgress={progress}
    onComplete={complete}
    onSafety={() => { void discardForSafety(); }}
    onFeedback={feedback}
    onCorrection={correction}
  />;
  // Staging only (EXPO_PUBLIC_PILOTS=1): an optional, clearly separate entry to the extra-practice pilots. Absent in Production.
  if (process.env.EXPO_PUBLIC_PILOTS !== '1') return rep;
  return <View style={{ flex: 1 }}>{rep}<View style={{ padding: M.space.base, backgroundColor: M.color.surface, borderTopWidth: 1, borderTopColor: M.color.border, alignItems: 'flex-start' }}><Action secondary onPress={() => router.push('/pilots')}>Optional extra practice (preview)</Action></View></View>;
}
