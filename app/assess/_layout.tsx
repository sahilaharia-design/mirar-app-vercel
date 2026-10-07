import { Redirect, Stack } from 'expo-router';
import { INNER_REP_V2 } from '../../lib/innerRep/runtime/flag';

export default function AssessLayout() {
  // v1 funnel: retired when v2 is on.
  if (INNER_REP_V2) return <Redirect href="/(auth)/login" />;
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
