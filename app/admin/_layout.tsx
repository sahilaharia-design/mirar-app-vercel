import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function AdminLayout() {
  // Web-only: no tab bar, clean frame
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'none',
      }}
    />
  );
}
