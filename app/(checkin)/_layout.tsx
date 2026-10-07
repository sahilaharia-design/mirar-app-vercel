import { Redirect, Stack } from 'expo-router';
import { INNER_REP_V2 } from '../../lib/innerRep/runtime/flag';

export default function CheckinLayout() {
  // v1 mirror screen: retired when v2 is on.
  if (INNER_REP_V2) return <Redirect href="/(tabs)" />;
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_bottom',
        gestureEnabled: true,
        gestureDirection: 'vertical',
      }}
    />
  );
}
