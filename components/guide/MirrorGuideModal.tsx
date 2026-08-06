import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';
import { useColors } from '../../contexts/theme-context';

interface MirrorGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

interface GuideCard {
  title: string;
  body: string;
}

export function MirrorGuideModal({ visible, onClose }: MirrorGuideModalProps) {
  const { t } = useTranslation();
  const colors = useColors();
  const guideCards = t('guide_cards', { returnObjects: true }) as GuideCard[];
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.cream }]}>
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.slateLight }]}>{t('guide_modal.eyebrow')}</Text>
            <Text style={[styles.title, { color: colors.slate }]}>{t('guide_modal.title')}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button">
            <Text style={[styles.closeText, { color: colors.slateMid }]}>{t('checkin.close')}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.introCard, { backgroundColor: colors.slate }]}>
            <Text style={[styles.introText, { color: colors.cream }]}>
              {t('guide_modal.intro_text')}
            </Text>
          </View>

          {guideCards.map((card) => (
            <View key={card.title} style={[styles.card, { backgroundColor: colors.white, borderColor: colors.borderLight }]}>
              <Text style={[styles.cardTitle, { color: colors.slate }]}>{card.title}</Text>
              <Text style={[styles.cardBody, { color: colors.slateMid }]}>{card.body}</Text>
            </View>
          ))}

          <View style={{ height: SPACING.xl }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  eyebrow: {
    fontSize: FONT_SIZE.xs,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE['2xl'],
    fontWeight: '300',
    letterSpacing: -0.2,
  },
  closeButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  closeText: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  introCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  introText: {
    fontSize: FONT_SIZE.lg,
    lineHeight: 28,
    fontWeight: '300',
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  cardTitle: {
    fontSize: FONT_SIZE.base,
    fontWeight: '500',
  },
  cardBody: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
  },
});
