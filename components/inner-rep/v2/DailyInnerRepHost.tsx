import React, { useCallback } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../stores/auth-store';
import { useInnerRepV2Store } from '../../../stores/inner-rep-v2-store';
import { DailyInnerRep } from './DailyExperience';
import { Action, Body } from './Foundation';
import { MIRAR as M } from '../../../design-system/native';

const greetingKey = () => { const h = new Date().getHours(); return h < 12 ? 'common.greeting_morning' : h < 17 ? 'common.greeting_afternoon' : 'common.greeting_evening'; };

/** Connects the Codex presentation (DailyInnerRep) to the v2 runtime. No presentation or engine logic lives here. */
export function DailyInnerRepHost() {
  const { t } = useTranslation();
  const userId = useAuthStore((s) => s.session?.user?.id);
  const { status, today, dayKey, practiceDays, load, progress, complete, discardForSafety, feedback } = useInnerRepV2Store();
  // reload on focus: picks up a new calendar day without a full app restart
  useFocusEffect(useCallback(() => { if (userId) void load(userId); }, [userId, load]));

  if (status === 'error') return <View style={{ flex: 1, backgroundColor: M.color.surface, padding: M.space.lg, gap: M.space.base }}><Body>Couldn't get today ready.</Body><Action onPress={() => userId && void load(userId)}>Try again</Action></View>;
  if (!today) return <View style={{ flex: 1, backgroundColor: M.color.surface, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={M.color.muted} accessibilityLabel="Getting today ready" /></View>;
  return <DailyInnerRep
    key={dayKey} // remount only on a new calendar day: rep → done keeps the presentation's own stage
    today={today} greeting={t(greetingKey())} practiceDays={practiceDays}
    draft={today.kind === 'rep' ? today.draft : undefined}
    onProgress={progress}
    onComplete={complete}
    onSafety={() => { void discardForSafety(); }}
    onFeedback={feedback}
  />;
}
