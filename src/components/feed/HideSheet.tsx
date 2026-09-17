import * as WebBrowser from 'expo-web-browser';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Sheet, SheetOption } from '@/components/ui/Sheet';
import { FORMAT_LABELS, TOPICS } from '@/content/topics';
import type { Card } from '@/content/types';
import { colors, space, type } from '@/theme/tokens';

interface HideSheetProps {
  card: Card | null;
  onClose(): void;
  onHideTopic(card: Card): void;
  onHideFormat(card: Card): void;
}

export function HideSheet({ card, onClose, onHideTopic, onHideFormat }: HideSheetProps) {
  return (
    <Sheet visible={card !== null} title="Tune your feed" onClose={onClose}>
      {card && (
        <>
          <SheetOption
            label={`Less ${TOPICS[card.topic].label}`}
            detail="Show this topic much less often"
            onPress={() => onHideTopic(card)}
          />
          <SheetOption
            label={`Fewer ${FORMAT_LABELS[card.format].toLowerCase()}`}
            detail="Show this format less often"
            onPress={() => onHideFormat(card)}
          />
          {card.format === 'fact' && (
            <SheetOption
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
        </>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  cancel: { padding: space.lg, alignItems: 'center' },
  cancelText: { ...type.body, color: colors.textMuted },
});
