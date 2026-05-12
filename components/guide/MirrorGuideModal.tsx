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
import { GUIDE_CARDS } from '../../lib/guidance';
import { COLORS, FONT_SIZE, SPACING, RADIUS } from '../../lib/constants';

interface MirrorGuideModalProps {
  visible: boolean;
  onClose: () => void;
}

export function MirrorGuideModal({ visible, onClose }: MirrorGuideModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>The Mirror Guide</Text>
            <Text style={styles.title}>How Mirar works</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityRole="button">
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.introCard}>
            <Text style={styles.introText}>
              One answer becomes a signal. Repeated signals become a pattern. Patterns become a mirror.
            </Text>
          </View>

          {GUIDE_CARDS.map((card) => (
            <View key={card.title} style={styles.card}>
              <Text style={styles.cardTitle}>{card.title}</Text>
              <Text style={styles.cardBody}>{card.body}</Text>
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
    backgroundColor: COLORS.cream,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: SPACING.md,
  },
  eyebrow: {
    fontSize: FONT_SIZE.xs,
    color: COLORS.slateLight,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: SPACING.xs,
    fontSize: FONT_SIZE['2xl'],
    color: COLORS.slate,
    fontWeight: '300',
    letterSpacing: -0.2,
  },
  closeButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  closeText: {
    fontSize: FONT_SIZE.sm,
    color: COLORS.slateMid,
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
    backgroundColor: COLORS.slate,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  introText: {
    fontSize: FONT_SIZE.lg,
    lineHeight: 28,
    color: COLORS.cream,
    fontWeight: '300',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    padding: SPACING.md,
    gap: SPACING.xs,
  },
  cardTitle: {
    fontSize: FONT_SIZE.base,
    color: COLORS.slate,
    fontWeight: '500',
  },
  cardBody: {
    fontSize: FONT_SIZE.sm,
    lineHeight: 22,
    color: COLORS.slateMid,
  },
});
