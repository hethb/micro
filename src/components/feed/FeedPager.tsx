import { useIsFocused } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, View, type LayoutChangeEvent, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CommentSheet } from '@/components/comments/CommentSheet';
import { useComments } from '@/comments/commentsStore';
import type { Card } from '@/content/types';
import type { FeedItem } from '@/feed/types';
import { useDwellTracker } from '@/hooks/useDwellTracker';
import { useFeed } from '@/hooks/useFeed';
import { useActivity } from '@/state/activityStore';
import { usePrefs } from '@/state/prefsStore';

import { CardRenderer } from './CardRenderer';
import { FeedHeader } from './FeedHeader';
import { HideSheet } from './HideSheet';
import { Toast } from './Toast';

/** Generate more when the user is this close to the end. */
const LOAD_AHEAD = 4;

export function FeedPager() {
  const insets = useSafeAreaInsets();
  const focused = useIsFocused();
  const { items, loadMore, rebuildAfter, replaceBrokenBreak } = useFeed();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [activeIndex, setActiveIndex] = useState(0);
  const [sheetCard, setSheetCard] = useState<Card | null>(null);
  const [commentCard, setCommentCard] = useState<Card | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const activeRef = useRef(0);

  useEffect(() => {
    if (items.length === 0) loadMore();
  }, [items.length, loadMore]);

  // Preference changes (Settings) and concept tuning (mind map) rebuild the upcoming queue.
  const prefsVersion = usePrefs((s) => s.version);
  const followedConcepts = useActivity((s) => s.followedConcepts);
  const mutedConcepts = useActivity((s) => s.mutedConcepts);
  const seenTuning = useRef({ prefsVersion, followedConcepts, mutedConcepts });
  useEffect(() => {
    const seen = seenTuning.current;
    const changed =
      seen.prefsVersion !== prefsVersion ||
      seen.followedConcepts !== followedConcepts ||
      seen.mutedConcepts !== mutedConcepts;
    if (focused && changed) {
      seenTuning.current = { prefsVersion, followedConcepts, mutedConcepts };
      rebuildAfter(activeRef.current);
    }
  }, [focused, prefsVersion, followedConcepts, mutedConcepts, rebuildAfter]);

  useDwellTracker(items[activeIndex], focused);

  // Keep the comment counts on the rail filled in for the cards around the one on screen.
  const loadCounts = useComments((s) => s.loadCounts);
  useEffect(() => {
    const nearbyCards = items
      .slice(Math.max(0, activeIndex - 1), activeIndex + LOAD_AHEAD)
      .filter((item) => item.kind === 'card')
      .map((item) => item.card.id);
    if (nearbyCards.length > 0) void loadCounts(nearbyCards);
  }, [items, activeIndex, loadCounts]);

  // Must stay referentially stable: FlatList doesn't support changing it on the fly.
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<FeedItem>[] }) => {
    const first = viewableItems[0];
    if (first?.index != null) {
      activeRef.current = first.index;
      setActiveIndex(first.index);
    }
  }, []);

  useEffect(() => {
    if (items.length > 0 && activeIndex >= items.length - LOAD_AHEAD) loadMore();
  }, [activeIndex, items.length, loadMore]);

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    if (width !== size.width || height !== size.height) setSize({ width, height });
  };

  const hide = useCallback(
    (message: string, apply: () => void) => {
      apply();
      setSheetCard(null);
      setToast(message);
      rebuildAfter(activeRef.current);
    },
    [rebuildAfter],
  );

  const renderItem = useCallback(
    ({ item, index }: { item: FeedItem; index: number }) => (
      <CardRenderer
        item={item}
        index={index}
        active={focused && index === activeIndex}
        nearby={Math.abs(index - activeIndex) <= 1}
        height={size.height}
        width={size.width}
        topInset={insets.top}
        onComment={setCommentCard}
        onMore={setSheetCard}
        onBreakFailed={replaceBrokenBreak}
      />
    ),
    [activeIndex, focused, size, insets.top, replaceBrokenBreak],
  );

  return (
    <View style={styles.fill} onLayout={onLayout}>
      {size.height > 0 && (
        <FlatList
          data={items}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          extraData={activeIndex}
          pagingEnabled
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({ length: size.height, offset: size.height * index, index })}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
          windowSize={3}
          initialNumToRender={2}
          maxToRenderPerBatch={2}
          removeClippedSubviews
        />
      )}

      <FeedHeader topInset={insets.top} />
      <Toast message={toast} onDone={() => setToast(null)} />

      <CommentSheet card={commentCard} onClose={() => setCommentCard(null)} />

      <HideSheet
        card={sheetCard}
        onClose={() => setSheetCard(null)}
        onHideTopic={(card) =>
          hide(`Got it — less of this topic`, () => useActivity.getState().hideTopic(card.topic))
        }
        onHideFormat={(card) =>
          hide(`Got it — fewer of these`, () => useActivity.getState().hideFormat(card.format))
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#000' },
});
