import * as Haptics from 'expo-haptics';
import { Pressable, Share, StyleSheet, Text, View } from 'react-native';

import { useComments } from '@/comments/commentsStore';
import type { Card } from '@/content/types';
import { useActivity } from '@/state/activityStore';
import { colors, space } from '@/theme/tokens';

import { Icon, type IconName } from '../ui/Icon';

interface ActionRailProps {
  card: Card;
  onComment(): void;
  onMore(): void;
  bottomOffset: number;
}

export function shareText(card: Card): string {
  switch (card.format) {
    case 'fact':
      return `${card.emoji} ${card.headline}\n\n${card.body}\n\nSource: ${card.sourceUrl}\n— via Micro`;
    case 'quote':
      return `“${card.text}” — ${card.author}\n\nvia Micro`;
    case 'book':
      return `📚 ${card.title} by ${card.author}\n${card.hook}\n\nTakeaway: ${card.takeaway}\n— via Micro`;
    case 'video':
      return `🎬 ${card.title}\n${card.caption}\n— via Micro`;
  }
}

export function ActionRail({ card, onComment, onMore, bottomOffset }: ActionRailProps) {
  const liked = useActivity((s) => s.likedIds.includes(card.id));
  const saved = useActivity((s) => s.saves.some((x) => x.cardId === card.id));
  const toggleLike = useActivity((s) => s.toggleLike);
  const toggleSave = useActivity((s) => s.toggleSave);
  const record = useActivity((s) => s.record);
  const comments = useComments((s) => s.counts[card.id]);

  const onShare = async () => {
    const result = await Share.share({ message: shareText(card) });
    if (result.action === Share.sharedAction) record(card, 'share');
  };

  return (
    <View style={[styles.rail, { bottom: bottomOffset }]} pointerEvents="box-none">
      <RailButton
        icon="heart"
        label={liked ? 'Liked' : 'Like'}
        color={liked ? colors.like : colors.text}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          toggleLike(card);
        }}
      />
      <RailButton
        icon="bookmark"
        label={saved ? 'Saved' : 'Save'}
        color={saved ? colors.accent : colors.text}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          toggleSave(card);
        }}
      />
      <RailButton
        icon="comment"
        label={comments ? String(comments) : 'Comment'}
        onPress={() => {
          Haptics.selectionAsync();
          onComment();
        }}
      />
      <RailButton icon="share" label="Share" onPress={onShare} />
      <RailButton icon="more" label="More" onPress={onMore} />
    </View>
  );
}

interface RailButtonProps {
  icon: IconName;
  label: string;
  color?: string;
  onPress(): void;
}

function RailButton({ icon, label, color = colors.text, onPress }: RailButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.button, pressed && { transform: [{ scale: 0.9 }] }]}>
      <View style={styles.iconBubble}>
        <Icon name={icon} size={26} color={color} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  rail: {
    position: 'absolute',
    right: space.md,
    alignItems: 'center',
    gap: space.lg,
  },
  button: { alignItems: 'center', gap: 2 },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  label: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowRadius: 4,
  },
});
