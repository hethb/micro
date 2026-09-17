import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { TOPICS } from '@/content/topics';
import type { BookCard } from '@/content/types';
import { useActivity } from '@/state/activityStore';
import { colors, radius, space, type } from '@/theme/tokens';

import type { CardViewProps } from './CardProps';
import { Pill } from './Pill';
import { CONTENT_PADDING } from './layout';

type Page =
  | { kind: 'cover' }
  | { kind: 'slide'; index: number; heading: string; body: string }
  | { kind: 'takeaway' };

export function BookSummaryCard({ card, active, width }: CardViewProps & { card: BookCard }) {
  const topic = TOPICS[card.topic];
  const listRef = useRef<FlatList<Page>>(null);
  const [page, setPage] = useState(0);
  const completed = useRef(false);

  const pages: Page[] = [
    { kind: 'cover' },
    ...card.slides.map((s, index) => ({ kind: 'slide' as const, index, ...s })),
    { kind: 'takeaway' },
  ];

  // Back to the cover once the card scrolls away (state adjusts during render, the list in an effect).
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    setWasActive(active);
    if (!active) setPage(0);
  }
  useEffect(() => {
    if (!active) listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [active]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    setPage(next);
    if (next === pages.length - 1 && !completed.current) {
      completed.current = true;
      useActivity.getState().record(card, 'complete');
    }
  };

  return (
    <LinearGradient colors={[topic.gradient[1], '#07070B']} style={styles.fill}>
      <View style={styles.progress} pointerEvents="none">
        {pages.map((p, i) => (
          <View key={i} style={[styles.segment, i <= page && styles.segmentOn]} />
        ))}
      </View>

      <FlatList
        ref={listRef}
        data={pages}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        renderItem={({ item }) => (
          <View style={[styles.page, { width }]}>
            <PageContent page={item} card={card} total={card.slides.length} />
          </View>
        )}
      />
    </LinearGradient>
  );
}

function PageContent({ page, card, total }: { page: Page; card: BookCard; total: number }) {
  switch (page.kind) {
    case 'cover':
      return (
        <View style={styles.cover}>
          <View style={styles.bookSpine}>
            <Text style={styles.bookTitle} numberOfLines={4}>
              {card.title}
            </Text>
            <Text style={styles.bookAuthor}>{card.author}</Text>
          </View>
          <Text style={styles.hook}>{card.hook}</Text>
          <Text style={styles.hint}>Swipe → for {total} key ideas</Text>
        </View>
      );
    case 'slide':
      return (
        <View style={styles.slide}>
          <Text style={styles.slideNumber}>
            {page.index + 1}/{total}
          </Text>
          <Text style={styles.slideHeading}>{page.heading}</Text>
          <Text style={styles.slideBody}>{page.body}</Text>
        </View>
      );
    case 'takeaway':
      return (
        <View style={styles.slide}>
          <Text style={styles.slideNumber}>TRY THIS TODAY</Text>
          <Text style={styles.slideHeading}>{card.takeaway}</Text>
          <Pill
            icon="book"
            label="Get the book"
            tone="accent"
            onPress={() =>
              WebBrowser.openBrowserAsync(
                `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(`${card.title} ${card.author}`)}`,
              )
            }
          />
        </View>
      );
  }
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  progress: {
    position: 'absolute',
    top: 88,
    left: space.xl,
    right: 84,
    flexDirection: 'row',
    gap: 4,
    zIndex: 1,
  },
  segment: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.25)' },
  segmentOn: { backgroundColor: colors.text },
  page: { flex: 1, justifyContent: 'center', ...CONTENT_PADDING },
  cover: { gap: space.xl },
  bookSpine: {
    alignSelf: 'flex-start',
    width: 150,
    minHeight: 210,
    padding: space.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceRaised,
    borderLeftWidth: 8,
    borderLeftColor: colors.accent,
    justifyContent: 'space-between',
  },
  bookTitle: { ...type.title, fontSize: 19, lineHeight: 24, color: colors.text },
  bookAuthor: { ...type.small, color: colors.textMuted },
  hook: { ...type.title, color: colors.text },
  hint: { ...type.small, color: colors.accent },
  slide: { gap: space.lg },
  slideNumber: { ...type.label, color: colors.accent },
  slideHeading: { ...type.hero, fontSize: 28, lineHeight: 34, color: colors.text },
  slideBody: { ...type.body, fontSize: 18, lineHeight: 27, color: 'rgba(255,255,255,0.88)' },
});
