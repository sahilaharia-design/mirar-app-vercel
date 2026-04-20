import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  StyleSheet,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

interface JournalExpanderProps {
  journalPrompt: string | null;
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
}

export function JournalExpander({
  journalPrompt,
  value,
  onChangeText,
  disabled = false,
}: JournalExpanderProps) {
  const [expanded, setExpanded] = useState(false);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.toggle}
        onPress={toggle}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text style={styles.toggleLabel}>
          {expanded ? '− Close journal' : '+ Add a note  (optional, not scored)'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.inputContainer}>
          {journalPrompt && (
            <Text style={styles.journalPrompt}>{journalPrompt}</Text>
          )}
          <TextInput
            style={styles.input}
            placeholder="Write freely. This won't affect your signal data."
            placeholderTextColor={COLORS.slateXLight}
            multiline
            textAlignVertical="top"
            value={value}
            onChangeText={onChangeText}
            editable={!disabled}
            maxLength={1000}
          />
          <Text style={styles.charCount}>{value.length} / 1000</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  toggle: {
    paddingVertical: SPACING.sm,
  },
  toggleLabel: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateLight,
    letterSpacing: 0.3,
  },
  inputContainer: {
    gap: SPACING.sm,
  },
  journalPrompt: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateMid,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  input: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZE.base,
    color: COLORS.slate,
    lineHeight: 24,
    minHeight: 100,
  },
  charCount: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateXLight,
    textAlign: 'right',
  },
});
