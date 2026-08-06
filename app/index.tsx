import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/auth-store';
import { View, ActivityIndicator } from 'react-native';
import { useColors } from '../contexts/theme-context';

export default function Index() {
  const { session, isInitialized } = useAuthStore();
  const colors = useColors();

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={colors.slate} />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)/" />;
  }

  return <Redirect href="/(auth)/login" />;
}
