import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../stores/auth-store';
import { useSettingsStore } from '../../stores/settings-store';
import { generateMirarId } from '../../lib/scoring';
import { MirarLogo } from '../../components/ui/MirarLogo';
import { LanguagePicker } from '../../components/ui/LanguagePicker';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const SLIDE_KEYS = [
  { key: 'daily', titleKey: 'onboarding.slide1_title', bodyKey: 'onboarding.slide1_body' },
  { key: 'notice', titleKey: 'onboarding.slide2_title', bodyKey: 'onboarding.slide2_body' },
  { key: 'time', titleKey: 'onboarding.slide3_title', bodyKey: 'onboarding.slide3_body' },
];

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const { session, setUser } = useAuthStore();

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    scrollRef.current?.scrollTo({ x: index * SCREEN_WIDTH, animated: true });
  };

  const handleNext = () => {
    if (currentSlide < SLIDE_KEYS.length - 1) {
      goToSlide(currentSlide + 1);
    }
  };

  const handleBegin = async () => {
    if (!session?.user) return;
    setIsCreating(true);

    const mirarid = generateMirarId();
    const now = new Date().toISOString();

    // Create user record
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: session.user.id,
        mirar_id: mirarid,
        email: session.user.email,
        onboarding_completed: true,
        cycle_start_date: now,
        current_cycle: 1,
        // Persist the language picked during onboarding so backend-generated
        // text (mirror insight, weekly signal, reports) uses it from day 1
        language: useSettingsStore.getState().language,
      })
      .select()
      .single();

    if (userError && userError.code !== '23505') {
      console.error('User create error:', userError);
      setIsCreating(false);
      return;
    }

    // Create cycle 1
    const { error: cycleError } = await supabase
      .from('cycles')
      .insert({
        user_id: session.user.id,
        cycle_number: 1,
        start_date: now,
        stage1_start: now,
        status: 'active',
      })
      .select()
      .single();

    if (cycleError) {
      console.error('Cycle create error:', cycleError);
    }

    if (user) setUser(user);
    setIsCreating(false);
    router.replace('/(tabs)/');
  };

  const isLast = currentSlide === SLIDE_KEYS.length - 1;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header row: logo + language picker */}
        <View style={styles.logoRow}>
          <MirarLogo size="sm" />
          <LanguagePicker variant="inline" />
        </View>

        {/* Slides */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.slides}
        >
          {SLIDE_KEYS.map((slide) => (
            <View key={slide.key} style={[styles.slide, { width: SCREEN_WIDTH }]}>
              <Text style={styles.slideTitle}>{t(slide.titleKey)}</Text>

              {slide.bodyKey && (
                <Text style={styles.slideBody}>{t(slide.bodyKey)}</Text>
              )}
            </View>
          ))}
        </ScrollView>

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDE_KEYS.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
              <View style={[styles.dot, i === currentSlide && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* CTA */}
        <View style={styles.cta}>
          {!isLast ? (
            <TouchableOpacity style={styles.nextButton} onPress={handleNext} activeOpacity={0.8}>
              <Text style={styles.nextButtonText}>{t('onboarding.continue')}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.beginButton, isCreating && styles.buttonDisabled]}
              onPress={handleBegin}
              disabled={isCreating}
              activeOpacity={0.8}
            >
              <Text style={styles.beginButtonText}>
                {isCreating ? t('onboarding.beginning') : t('onboarding.begin')}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.cream,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
  },
  logoRow: {
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slides: {
    flex: 1,
  },
  slide: {
    paddingRight: SPACING.lg,
    justifyContent: 'center',
    gap: SPACING.md,
  },
  slideTitle: {
    fontSize: FONT_SIZE['2xl'],
    color: COLORS.slate,
    fontWeight: '300',
    lineHeight: 38,
    letterSpacing: -0.3,
  },
  slideBody: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slateMid,
    lineHeight: 26,
  },
  themeGrid: {
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    paddingVertical: 10,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  themeCode: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    fontWeight: '600',
    letterSpacing: 1,
    width: 36,
    paddingTop: 2,
  },
  themeTextCol: {
    flex: 1,
    gap: 2,
  },
  themeName: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slate,
  },
  themeShort: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    lineHeight: 16,
  },
  mirrorMock: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.warmGlowLight,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  mirrorMockLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mirrorMockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accentTeal,
  },
  mirrorMockLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1,
    color: COLORS.slateLight,
    textTransform: 'uppercase',
  },
  mirrorMockText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateMid,
    lineHeight: 22,
    fontStyle: 'italic',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.slateXLight,
  },
  dotActive: {
    backgroundColor: COLORS.slate,
    width: 18,
  },
  cta: {
    paddingBottom: SPACING.xl,
  },
  nextButton: {
    backgroundColor: COLORS.creamDark,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nextButtonText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slate,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  beginButton: {
    backgroundColor: COLORS.slate,
    borderRadius: RADIUS.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  beginButtonText: {
    fontSize: FONT_SIZE.base,
    color: COLORS.white,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});
