import { Redirect, Stack } from 'expo-router';

// Dev tools — development builds only (never reachable in a production bundle)
const isAllowed = __DEV__;

export default function DevLayout() {
  if (!isAllowed) {
    return <Redirect href="/(tabs)" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
