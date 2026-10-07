import { Redirect, Stack } from 'expo-router';

// Dev / staging tools. Reachable only in development builds, or in a staging build that sets
// EXPO_PUBLIC_REVIEW_STATES=1. That variable must never be set in the Production environment.
const isAllowed = __DEV__ || process.env.EXPO_PUBLIC_REVIEW_STATES === '1';

export default function DevLayout() {
  if (!isAllowed) {
    return <Redirect href="/(tabs)" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
