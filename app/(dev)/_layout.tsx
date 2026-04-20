import { Redirect, Stack } from 'expo-router';

// Dev tools — only accessible in development or when EXPO_PUBLIC_DEV_TOOLS=true
const isAllowed = __DEV__ || process.env.EXPO_PUBLIC_DEV_TOOLS === 'true';

export default function DevLayout() {
  if (!isAllowed) {
    return <Redirect href="/(tabs)" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
