import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSettingsStore } from '../../stores/settings-store';
import { SUPPORTED_LANGUAGES, SupportedLanguage } from '../../lib/i18n';
import { useColors } from '../../contexts/theme-context';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

interface LanguagePickerProps {
  /**
   * "inline" — compact row of pill buttons, suitable for headers.
   * "full"   — same row but with a label above, suitable for onboarding.
   */
  variant?: 'inline' | 'full';
}

export function LanguagePicker({ variant = 'inline' }: LanguagePickerProps) {
  const colors = useColors();
  const { language, setLanguage } = useSettingsStore();

  const handleSelect = (code: SupportedLanguage) => {
    if (code !== language) {
      setLanguage(code);
    }
  };

  const pills = (
    <View style={styles.row}>
      {SUPPORTED_LANGUAGES.map(({ code, label }) => {
        const isActive = language === code;
        return (
          <TouchableOpacity
            key={code}
            onPress={() => handleSelect(code)}
            activeOpacity={0.7}
            style={[
              styles.pill,
              {
                backgroundColor: isActive ? colors.slate : colors.creamDark,
                borderColor: isActive ? colors.slate : colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.pillText,
                { color: isActive ? colors.creamLight : colors.slateMid },
              ]}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (variant === 'full') {
    return (
      <View style={styles.fullContainer}>
        {pills}
      </View>
    );
  }

  return pills;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: SPACING.xs,
    flexWrap: 'nowrap',
  },
  pill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  pillText: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  fullContainer: {
    alignItems: 'flex-start',
  },
});
