import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { FONT_SIZE } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

function TabIcon({ name, focused, colors }: { name: string; focused: boolean; colors: ReturnType<typeof useColors> }) {
  const icons: Record<string, string> = {
    index: '◎',
    profile: '○',
  };
  return (
    <Text style={[styles.icon, { color: focused ? colors.slate : colors.slateMid }]}>
      {icons[name] ?? '○'}
    </Text>
  );
}

function TabLabel({ label, focused, colors }: { label: string; focused: boolean; colors: ReturnType<typeof useColors> }) {
  return (
    <Text
      style={[
        styles.label,
        { color: focused ? colors.slate : colors.slateMid },
        focused && styles.labelFocused,
      ]}
    >
      {label}
    </Text>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();
  const colors = useColors();

  const TAB_CONFIG = [
    { name: 'index', label: t('nav.today') },
    { name: 'profile', label: t('nav.profile') },
  ];
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { backgroundColor: colors.creamLight, borderTopColor: colors.border }],
        tabBarActiveTintColor: colors.slate,
        tabBarInactiveTintColor: colors.slateMid,
        tabBarShowLabel: false,
      }}
    >
      {TAB_CONFIG.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            tabBarIcon: ({ focused }) => (
              <View style={styles.tabItem}>
                <TabIcon name={tab.name} focused={focused} colors={colors} />
                <TabLabel label={tab.label} focused={focused} colors={colors} />
              </View>
            ),
          }}
        />
      ))}
      {/* v1 surfaces: no tab, and the routes redirect to Today (see signals.tsx / reports.tsx). */}
      <Tabs.Screen name="signals" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 12,
    paddingTop: 8,
  },
  tabItem: {
    alignItems: 'center',
    gap: 2,
  },
  icon: {
    fontSize: 18,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    letterSpacing: 0.5,
  },
  labelFocused: {
    fontWeight: '500',
  },
});
