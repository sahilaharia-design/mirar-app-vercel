import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { COLORS, FONTS, FONT_SIZE } from '../../lib/constants';

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    index: '◎',
    signals: '∿',
    reports: '▤',
    profile: '○',
  };
  return (
    <Text style={[styles.icon, focused && styles.iconFocused]}>
      {icons[name] ?? '○'}
    </Text>
  );
}

function TabLabel({ label, focused }: { label: string; focused: boolean }) {
  return (
    <Text style={[styles.label, focused && styles.labelFocused]}>{label}</Text>
  );
}

export default function TabsLayout() {
  const { t } = useTranslation();

  const TAB_CONFIG = [
    { name: 'index', label: t('nav.today') },
    { name: 'signals', label: t('nav.signals') },
    { name: 'reports', label: t('nav.mirror') },
    { name: 'profile', label: t('nav.profile') },
  ];
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: COLORS.slate,
        tabBarInactiveTintColor: COLORS.slateLight,
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
                <TabIcon name={tab.name} focused={focused} />
                <TabLabel label={tab.label} focused={focused} />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: COLORS.creamLight,
    borderTopColor: COLORS.border,
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
    color: COLORS.slateLight,
  },
  iconFocused: {
    color: COLORS.slate,
  },
  label: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    letterSpacing: 0.5,
  },
  labelFocused: {
    color: COLORS.slate,
    fontWeight: '500',
  },
});
