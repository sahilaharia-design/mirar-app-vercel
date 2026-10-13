import React from 'react';
import { Redirect } from 'expo-router';

// OPTIONAL EXTRA PRACTICE (pilots). Staging only. The direct process.env comparison is inlined at build time, so a build
// without EXPO_PUBLIC_PILOTS=1 (Production) contains none of the pilot screen, authored content or fixtures.
// EXPO_PUBLIC_PILOTS must never be set in the Production environment.
const Screen: React.ComponentType | null = process.env.EXPO_PUBLIC_PILOTS === '1' ? require('../components/pilots/PilotsScreen').default : null;
export default function PilotsRoute() {
  if (!Screen) return <Redirect href="/(tabs)" />;
  return <Screen />;
}
