import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import OnboardingScreen from './OnboardingScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <OnboardingScreen onComplete={() => console.log('Onboarding complete')} />
    </SafeAreaProvider>
  );
}
