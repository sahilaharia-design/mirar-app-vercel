/**
 * JournalExpander — V3 · Linen & Brass
 *
 * Step 2 of the check-in flow. Full-screen layout:
 * ─ Header strip: Today's mirror · Captured · HH:MM
 * ─ Echoed answer (serif italic, ink, 22px) with simple captured label
 * ─ Optional private note textarea (paper bg, ruleLight border)
 * ─ "Held privately" / char-count footer metadata
 * ─ Footer: Skip pill  +  "Record today's mirror" pill
 *
 * Light-mode only — uses COLORS directly, no useColors().
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
import {
  COLORS,
  FONTS,
  FONT_SIZE,
  SPACING,
} from '../../lib/constants';
import {
  V3_SETTLE_DURATION,
  V3_SETTLE_EASING,
  V3_STAGGER_MS,
  V3_REDUCED_FADE_DURATION,
} from '../../lib/animations';

// ─── Types ────────────────────────────────────────────────────────────────────

interface JournalExpanderProps {
  /** The echoed answer text (shown as serif italic quote) */
  selectedOptionText?: string;
  /** Theme codes from the selected option */
  theme1Code?: string;
  theme1Level?: string;
  theme2Code?: string;
  theme2Level?: string;
  /** Day info for the header strip */
  dayNumber?: number;
  totalDays?: number;
  /** Optional: override captured time label ("9:42"). Defaults to current HH:MM. */
  capturedTime?: string;
  /** Journal textarea value */
  value: string;
  onChangeText: (text: string) => void;
  disabled?: boolean;
  onSubmit?: () => void;
  onSkip?: () => void;
  isSubmitting?: boolean;

  // Legacy compat props (not rendered in V3 but accepted silently)
  journalPrompt?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNow(): string {
  const d = new Date();
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

// ─── Animated section wrapper ─────────────────────────────────────────────────

function FadeSlide({
  children,
  delayMs,
  reducedMotion,
}: {
  children: React.ReactNode;
  delayMs: number;
  reducedMotion: boolean;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(reducedMotion ? 0 : 6);

  useEffect(() => {
    const duration = reducedMotion ? V3_REDUCED_FADE_DURATION : V3_SETTLE_DURATION;
    const easing = reducedMotion ? undefined : V3_SETTLE_EASING;
    opacity.value = withDelay(delayMs, withTiming(1, { duration, easing }));
    if (!reducedMotion) {
      translateY.value = withDelay(delayMs, withTiming(0, { duration, easing: V3_SETTLE_EASING }));
    }
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={style}>{children}</Animated.View>;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function JournalExpander({
  selectedOptionText,
  theme1Code,
  theme1Level,
  theme2Code,
  theme2Level,
  dayNumber: _dayNumber = 1,
  totalDays: _totalDays,
  capturedTime,
  value,
  onChangeText,
  disabled = false,
  onSubmit,
  onSkip,
  isSubmitting = false,
  // legacy compat
  journalPrompt: _journalPrompt,
}: JournalExpanderProps) {
  const { t } = useTranslation();
  const reducedMotion = useRef(false);
  const timeLabel = capturedTime ?? formatNow();
  const charMax = 280;

  // ─── Accessibility: reduce motion ─────────────────────────────────────────
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((val) => {
      reducedMotion.current = val;
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (val) => {
      reducedMotion.current = val;
    });
    return () => sub.remove();
  }, []);

  const stagger = (i: number) => i * V3_STAGGER_MS;

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header strip ──────────────────────────────────────────────── */}
        <FadeSlide delayMs={stagger(0)} reducedMotion={reducedMotion.current}>
          <View style={styles.headerStrip}>
            <Text style={styles.capsLabel}>
              <Text style={styles.capsLabelInk}>{t('common.your_alignment_today')}</Text>
            </Text>
            <Text style={styles.capsLabel}>{t('journal_expander.captured', { time: timeLabel })}</Text>
          </View>
          <View style={styles.rule} />
        </FadeSlide>

        {/* ── Echoed answer ─────────────────────────────────────────────── */}
        {selectedOptionText ? (
          <FadeSlide delayMs={stagger(1)} reducedMotion={reducedMotion.current}>
            <View style={styles.echoSection}>
              <Text style={styles.echoText}>
                "{selectedOptionText}"
              </Text>
              <Text style={styles.themeBadge}>{t('journal_expander.answer_captured')}</Text>
            </View>
          </FadeSlide>
        ) : null}

        {/* ── Journal input ─────────────────────────────────────────────── */}
        <FadeSlide delayMs={stagger(2)} reducedMotion={reducedMotion.current}>
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>{t('journal_expander.input_label')}</Text>
            <Text style={styles.inputHelper}>{t('journal_expander.input_helper')}</Text>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.input}
                placeholder={t('journal_expander.input_placeholder')}
                placeholderTextColor={COLORS.slateXLight}
                multiline
                textAlignVertical="top"
                value={value}
                onChangeText={onChangeText}
                editable={!disabled && !isSubmitting}
                maxLength={charMax}
                autoFocus={false}
                scrollEnabled={false}
              />
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>{t('journal_expander.held_privately')}</Text>
              <Text style={styles.metaLabel}>{value.length} / {charMax}</Text>
            </View>
          </View>
        </FadeSlide>

        {/* Spacer so content doesn't sit behind footer */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ── Footer buttons ────────────────────────────────────────────────── */}
      <FadeSlide delayMs={stagger(3)} reducedMotion={reducedMotion.current}>
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={onSkip}
            disabled={disabled || isSubmitting}
            activeOpacity={0.7}
            accessibilityLabel={t('journal_expander.skip_a11y')}
            accessibilityRole="button"
          >
            <Text style={styles.skipLabel}>{t('journal_expander.skip')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.recordButton,
              (disabled || isSubmitting) && styles.recordButtonDisabled,
            ]}
            onPress={onSubmit}
            disabled={disabled || isSubmitting}
            activeOpacity={0.85}
            accessibilityLabel={t('journal_expander.record_a11y')}
            accessibilityRole="button"
          >
            <Text style={styles.recordLabel}>
              {isSubmitting ? t('journal_expander.recording') : t('journal_expander.record_mirror')}
            </Text>
          </TouchableOpacity>
        </View>
      </FadeSlide>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.paper,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 26,
    paddingTop: 20,
    paddingBottom: 24,
  },

  // Header
  headerStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  rule: {
    height: 1,
    backgroundColor: COLORS.ruleLight,
    marginBottom: 28,
  },
  capsLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.slateLight,
  },
  capsLabelInk: {
    color: COLORS.ink,
  },

  // Echo section
  echoSection: {
    marginBottom: 28,
  },
  echoText: {
    fontFamily: FONTS.displayItalic,
    fontSize: 22,
    lineHeight: 22 * 1.3,
    color: COLORS.ink,
    letterSpacing: -0.2,
  },
  themeBadge: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    color: COLORS.brass,
    marginTop: 14,
  },

  // Input section
  inputSection: {
    gap: 0,
  },
  inputLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: FONT_SIZE.base,
    letterSpacing: 0,
    color: COLORS.slate,
  },
  inputHelper: {
    fontFamily: FONTS.body,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
    color: COLORS.slateLight,
    marginTop: 6,
    marginBottom: 12,
  },
  inputCard: {
    backgroundColor: COLORS.paper,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.ruleLight,
    padding: 16,
    minHeight: 180,
  },
  input: {
    fontFamily: FONTS.displayItalic,
    fontSize: FONT_SIZE.md,
    lineHeight: FONT_SIZE.md * 1.5,
    color: COLORS.slate,
    minHeight: 148,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  metaLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: COLORS.slateXLight,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 26,
    paddingBottom: Platform.OS === 'ios' ? 32 : 20,
    paddingTop: 12,
    backgroundColor: COLORS.paper,
    borderTopWidth: 1,
    borderTopColor: COLORS.ruleLight,
  },
  skipButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.rule,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipLabel: {
    fontFamily: FONTS.body,
    fontSize: 13,
    color: COLORS.slateMid,
    letterSpacing: 0.2,
  },
  recordButton: {
    flex: 2,
    backgroundColor: COLORS.slate,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonDisabled: {
    opacity: 0.4,
  },
  recordLabel: {
    fontFamily: FONTS.bodyMedium,
    fontSize: 13,
    color: COLORS.cream,
    letterSpacing: 0.3,
    fontWeight: '500',
  },
});
