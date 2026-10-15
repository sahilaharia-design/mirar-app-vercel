import React from 'react';
import { Redirect } from 'expo-router';

// Practice history (opt-in backup) settings. LOCAL-ONLY PROTOTYPE, default off. The direct env comparison is inlined at build time, so a build without
// EXPO_PUBLIC_HISTORY_SYNC=1 (Production) contains none of the continuity code. EXPO_PUBLIC_HISTORY_SYNC must never be set in the Production environment.
const Screen: React.ComponentType | null = process.env.EXPO_PUBLIC_HISTORY_SYNC === '1' ? require('../components/continuity/ContinuityHosts').default : null;
export default function ContinuityRoute() {
  if (!Screen) return <Redirect href="/(tabs)" />;
  return <Screen />;
}
