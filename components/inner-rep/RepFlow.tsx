import React, { useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../contexts/theme-context';
import { FONTS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { Exercise, RepAnswer, RepOption } from '../../lib/innerRep/types';

interface Props {
  exercise: Exercise;
  onComplete: (answer: RepAnswer, durationMs: number) => void;
}

// Renders any interaction type. "I don't know" is always offered on a choice
// step, and words are always skippable — never a forced answer.
export function RepFlow({ exercise, onComplete }: Props) {
  const { t } = useTranslation();
  const colors = useColors();
  const startedAt = useRef(Date.now());
  const [step, setStep] = useState<'main' | 'follow' | 'words'>('main');
  const [primary, setPrimary] = useState<string | undefined>();
  const [words, setWords] = useState('');
  const type = exercise.interaction_type;

  const finish = (a: Partial<RepAnswer>) =>
    onComplete({ unknown: false, ...a, primary: a.primary ?? primary }, Date.now() - startedAt.current);

  const pickMain = (id: string | null) => {
    if (id === null) return finish({ unknown: true, primary: undefined });
    if (type === 'choice_then_reflection' && exercise.follow_up) { setPrimary(id); setStep('follow'); return; }
    finish({ primary: id });
  };

  const Option = ({ opt, onPress }: { opt: RepOption; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.opt, { backgroundColor: colors.white, borderColor: colors.border, opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={[styles.optText, { color: colors.slate }]}>{opt.label}</Text>
    </Pressable>
  );
  const Unknown = ({ onPress }: { onPress: () => void }) => (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.unknown}>
      <Text style={[styles.unknownText, { color: colors.slateMid }]}>{t('innerRep.dont_know')}</Text>
    </Pressable>
  );

  if (step === 'follow' && exercise.follow_up) {
    return (
      <View style={styles.wrap}>
        <Text style={[styles.prompt, { color: colors.ink }]} accessibilityRole="header">{exercise.follow_up.prompt}</Text>
        <View style={styles.list}>
          {exercise.follow_up.options.map((o) => (
            <Option key={o.id} opt={o} onPress={() => finish({ primary, followUp: o.id })} />
          ))}
        </View>
        <Unknown onPress={() => finish({ primary })} />
      </View>
    );
  }

  if (type === 'words') {
    return (
      <View style={styles.wrap}>
        <Text style={[styles.prompt, { color: colors.ink }]} accessibilityRole="header">{exercise.prompt}</Text>
        <TextInput
          value={words}
          onChangeText={setWords}
          placeholder={t('innerRep.words_placeholder')}
          placeholderTextColor={colors.slateLight}
          maxLength={80}
          style={[styles.input, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.white }]}
          accessibilityLabel={exercise.prompt}
        />
        <Text style={[styles.hint, { color: colors.slateLight }]}>{t('innerRep.words_hint')}</Text>
        <View style={styles.rowBtns}>
          <Pressable
            onPress={() => finish({ words: words.trim() })}
            disabled={!words.trim()}
            accessibilityRole="button"
            style={[styles.primaryBtn, { backgroundColor: colors.slate, opacity: words.trim() ? 1 : 0.35 }]}
          >
            <Text style={[styles.primaryText, { color: colors.cream }]}>{t('innerRep.next')}</Text>
          </Pressable>
          <Unknown onPress={() => finish({ unknown: true })} />
        </View>
      </View>
    );
  }

  const options: RepOption[] = type === 'compare' ? [...(exercise.statements ?? [])] : exercise.options ?? [];
  return (
    <View style={styles.wrap}>
      <Text style={[styles.prompt, { color: colors.ink }]} accessibilityRole="header">{exercise.prompt}</Text>
      {type === 'compare' && <Text style={[styles.hint, { color: colors.slateLight }]}>{t('innerRep.which_true')}</Text>}
      <View style={styles.list}>
        {options.map((o) => (
          <Option key={o.id} opt={o} onPress={() => pickMain(o.id)} />
        ))}
      </View>
      <Unknown onPress={() => pickMain(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: SPACING.md },
  prompt: { fontFamily: FONTS.display, fontSize: 30, lineHeight: 36, letterSpacing: -0.3 },
  list: { gap: 10 },
  opt: { borderWidth: 1, borderRadius: RADIUS.lg, paddingVertical: 16, paddingHorizontal: 18, minHeight: 56, justifyContent: 'center' },
  optText: { fontSize: FONT_SIZE.md, lineHeight: 22 },
  unknown: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 20 },
  unknownText: { fontSize: FONT_SIZE.sm, textDecorationLine: 'underline' },
  hint: { fontSize: FONT_SIZE.sm },
  input: { borderWidth: 1, borderRadius: RADIUS.lg, paddingVertical: 14, paddingHorizontal: 16, fontSize: FONT_SIZE.md },
  rowBtns: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  primaryBtn: { borderRadius: 999, paddingVertical: 14, paddingHorizontal: 28 },
  primaryText: { fontFamily: FONTS.bodyMedium, fontSize: 15 },
});
