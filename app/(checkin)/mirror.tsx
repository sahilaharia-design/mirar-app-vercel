import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MirrorScreen } from '../../components/check-in/MirrorScreen';
import { useAuthStore } from '../../stores/auth-store';
import { useCycleStore } from '../../stores/cycle-store';
import { useColors } from '../../contexts/theme-context';
import { ThemeCode, SignalLevel } from '../../types/mirar';

export default function MirrorRoute() {
  const colors = useColors();
  const { session, isInitialized } = useAuthStore();
  const { refreshScores } = useCycleStore();

  // Params passed from check-in flow after submission
  const params = useLocalSearchParams<{
    day_number: string;
    cycle_number: string;
    alignment_score: string;
    score_before: string;
    theme1_code: string;
    theme1_level: string;
    theme2_code: string;
    theme2_level: string;
    tomorrow_tease: string;
  }>();

  const userId = session?.user?.id;

  // Wait for auth to initialize before deciding — a direct load or reload of
  // this route renders before the session resolves, and redirecting on that
  // first frame would bounce the user out of their own mirror reading.
  if (!isInitialized) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.slateMid} />
      </SafeAreaView>
    );
  }

  if (!userId) {
    router.replace('/(tabs)');
    return null;
  }

  const handleDone = () => {
    refreshScores();
    // Navigate back to tabs root, replacing the mirror route
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <MirrorScreen
        userId={userId}
        dayNumber={parseInt(params.day_number ?? '1', 10)}
        cycleNumber={parseInt(params.cycle_number ?? '1', 10)}
        alignmentScore={params.alignment_score ? parseInt(params.alignment_score, 10) : null}
        scoreBefore={params.score_before ? parseInt(params.score_before, 10) : null}
        theme1Code={(params.theme1_code ?? 'IAP') as ThemeCode}
        theme1Level={(params.theme1_level ?? 'Medium') as SignalLevel}
        theme2Code={(params.theme2_code ?? 'EWB') as ThemeCode}
        theme2Level={(params.theme2_level ?? 'Medium') as SignalLevel}
        tomorrowTease={params.tomorrow_tease || null}
        onDone={handleDone}
      />
    </SafeAreaView>
  );
}
