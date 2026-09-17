import * as WebBrowser from 'expo-web-browser';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FORMAT_LABELS, TOPICS } from '@/content/topics';
import type { Card } from '@/content/types';
import { colors, radius, space, type } from '@/theme/tokens';

interface HideSheetProps {
  card: Card | null;
  onClose(): void;
  onHideTopic(card: Card): void;
  onHideFormat(card: Card): void;
}

export function HideSheet({ card, onClose, onHideTopic, onHideFormat }: HideSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={card !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      {card && (
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
          <View style={styles.grabber} />
          <Text style={styles.heading}>Tune your feed</Text>
          <Option
            label={`Less ${TOPICS[card.topic].label}`}
            detail="Show this topic much less often"
            onPress={() => onHideTopic(card)}
          />
          <Option
            label={`Fewer ${FORMAT_LABELS[card.format].toLowerCase()}`}
            detail="Show this format less often"
            onPress={() => onHideFormat(card)}
          />
          {card.format === 'fact' && (
            <Option
              label="Report inaccuracy"
              detail={`Check the source: ${card.sourceLabel}`}
              onPress={() => {
                onClose();
                WebBrowser.openBrowserAsync(card.sourceUrl);
              }}
            />
          )}
          <Pressable onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      )}
    </Modal>
  );
}

function Option({ label, detail, onPress }: { label: string; detail: string; onPress(): void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.option, pressed && { opacity: 0.7 }]}>
      <Text style={styles.optionLabel}>{label}</Text>
      <Text style={styles.optionDetail}>{detail}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    gap: space.sm,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: space.sm,
  },
  heading: { ...type.title, color: colors.text, marginBottom: space.sm },
  option: {
    padding: space.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    gap: 2,
  },
  optionLabel: { ...type.body, fontWeight: '700', color: colors.text },
  optionDetail: { ...type.small, fontWeight: '500', color: colors.textMuted },
  cancel: { padding: space.lg, alignItems: 'center' },
  cancelText: { ...type.body, color: colors.textMuted },
});
