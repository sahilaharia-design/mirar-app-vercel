import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth-store';
import { View, ActivityIndicator } from 'react-native';
import { COLORS } from '../lib/constants';

export default function Index() {
  const { session, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.cream, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={COLORS.slate} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)/" />;
  }

  return <Redirect href="/(auth)/login" />;
}
