import React from 'react';
import { Text } from 'react-native';
import { useFonts } from 'expo-font';
import Serif from '../../../assets/fonts/InstrumentSerif-Regular.ttf';
import Sans from '../../../assets/fonts/DMSans-Variable.ttf';
export default function FontGate({ children }: { children: React.ReactNode }) {
 const [loaded, error] = useFonts({ 'Instrument Serif': Serif, 'DM Sans': Sans });
 if (error) return <Text accessibilityRole="alert">The typefaces could not load. Please reload.</Text>;
 if (!loaded) return <Text accessibilityLiveRegion="polite">Loading…</Text>;
 return <>{children}</>;
}
