import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAccount } from '@/account/accountStore';
import { MAX_COMMENT_LENGTH, useComments, type Comment } from '@/comments/commentsStore';
import { useModeration, type ReportReason } from '@/comments/moderationStore';
import { formatAge } from '@/comments/time';
import type { Card } from '@/content/types';
import { useActivity } from '@/state/activityStore';
import { colors, radius, space, type } from '@/theme/tokens';

import { Icon } from '../ui/Icon';

interface CommentSheetProps {
  card: Card | null;
  onClose(): void;
}

/** Comment thread for one card, posted under the signed-in profile's name. */
export function CommentSheet({ card, onClose }: CommentSheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={card !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close comments" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + space.md }]}>
          <View style={styles.grabber} />
          {/* Keyed by card, so the draft and any error start clean for each thread. */}
          {card && <CommentThread key={card.id} card={card} />}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CommentThread({ card }: { card: Card }) {
  const thread = useComments((s) => s.threads[card.id]);
  const loadThread = useComments((s) => s.loadThread);
  const post = useComments((s) => s.post);
  const remove = useComments((s) => s.remove);
  const hide = useComments((s) => s.hide);
  const userId = useAccount((s) => s.userId);

  const [draft, setDraft] = useState('');
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void loadThread(card.id);
  }, [card.id, loadThread]);

  const submit = async () => {
    setPosting(true);
    setError(null);
    try {
      await post(card.id, draft);
      setDraft('');
      // Commenting says a lot about what someone cares about, so it feeds the ranking.
      useActivity.getState().record(card, 'comment');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post your comment.');
    } finally {
      setPosting(false);
    }
  };

  const onDelete = useCallback(
    async (comment: Comment) => {
      setError(null);
      try {
        await remove(comment.cardId, comment.id);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not delete that comment.');
      }
    },
    [remove],
  );

  const onReport = useCallback(
    async (comment: Comment, reason: ReportReason) => {
      setError(null);
      try {
        await useModeration.getState().report(comment.id, reason);
        hide((c) => c.id === comment.id);
        Alert.alert('Thanks for letting us know', 'This comment is hidden for you and our team will review it.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not report that comment.');
      }
    },
    [hide],
  );

  const onBlock = useCallback(
    async (comment: Comment) => {
      setError(null);
      try {
        await useModeration.getState().block({ id: comment.authorId, name: comment.authorName });
        hide((c) => c.authorId === comment.authorId);
        Alert.alert(`${comment.authorName} blocked`, 'You won\u2019t see their comments. Undo this in Settings.');
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not block that person.');
      }
    },
    [hide],
  );

  const items = thread?.items ?? [];
  const loading = !thread || (thread.status === 'loading' && items.length === 0);

  return (
    <>
      <Text style={styles.heading}>{items.length > 0 ? `Comments · ${items.length}` : 'Comments'}</Text>

      {loading ? (
        <View style={styles.placeholder}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : thread.status === 'error' ? (
        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>Couldn&apos;t load comments. Check your connection.</Text>
          <Pressable onPress={() => void loadThread(card.id)} accessibilityRole="button">
            <Text style={styles.retry}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.placeholder}>
              <Text style={styles.placeholderEmoji}>💬</Text>
              <Text style={styles.placeholderText}>No comments yet. Start the conversation.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <CommentRow
              comment={item}
              mine={item.authorId === userId}
              onDelete={onDelete}
              onReport={onReport}
              onBlock={onBlock}
            />
          )}
        />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.composer}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Add a comment…"
          placeholderTextColor={colors.textDim}
          selectionColor={colors.accent}
          accessibilityLabel="Add a comment"
          multiline
          maxLength={MAX_COMMENT_LENGTH}
          style={styles.input}
        />
        <Pressable
          onPress={submit}
          disabled={posting || draft.trim().length === 0}
          accessibilityRole="button"
          accessibilityLabel="Post comment"
          style={({ pressed }) => [
            styles.send,
            (posting || draft.trim().length === 0) && styles.sendDisabled,
            pressed && { opacity: 0.8 },
          ]}>
          {posting ? (
            <ActivityIndicator color={colors.accentInk} />
          ) : (
            <Icon name="send" size={20} color={colors.accentInk} />
          )}
        </Pressable>
      </View>
    </>
  );
}

interface CommentRowProps {
  comment: Comment;
  mine: boolean;
  onDelete(comment: Comment): void;
  onReport(comment: Comment, reason: ReportReason): void;
  onBlock(comment: Comment): void;
}

function CommentRow({ comment, mine, onDelete, onReport, onBlock }: CommentRowProps) {
  const openMenu = () => {
    Alert.alert(comment.authorName, 'What would you like to do?', [
      { text: 'Report comment', style: 'destructive', onPress: askReason },
      { text: `Block ${comment.authorName}`, style: 'destructive', onPress: confirmBlock },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const askReason = () => {
    Alert.alert('Report this comment', 'Tell us what\u2019s wrong with it.', [
      { text: 'Spam or scam', onPress: () => onReport(comment, 'spam') },
      { text: 'Abuse or hate', onPress: () => onReport(comment, 'abuse') },
      { text: 'Something else', onPress: () => onReport(comment, 'other') },
    ]);
  };

  const confirmBlock = () => {
    Alert.alert(`Block ${comment.authorName}?`, 'You won\u2019t see their comments anywhere in Micro.', [
      { text: 'Block', style: 'destructive', onPress: () => onBlock(comment) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  return (
    <View style={styles.comment}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{comment.authorName.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.commentBody}>
        <Text style={styles.commentMeta}>
          {mine ? 'You' : comment.authorName} · {formatAge(comment.createdAt)}
        </Text>
        <Text style={styles.commentText}>{comment.body}</Text>
      </View>
      {mine ? (
        <Pressable
          onPress={() => onDelete(comment)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Delete your comment"
          style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <Icon name="trash" size={16} color={colors.textDim} />
        </Pressable>
      ) : (
        <Pressable
          onPress={openMenu}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Report or block ${comment.authorName}`}
          style={({ pressed }) => pressed && { opacity: 0.6 }}>
          <Icon name="more" size={16} color={colors.textDim} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.scrim },
  sheet: {
    maxHeight: '100%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: space.md,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: space.sm,
  },
  heading: { ...type.title, color: colors.text, paddingHorizontal: space.xl, marginBottom: space.sm },
  list: { maxHeight: 360 },
  listContent: { paddingHorizontal: space.xl, gap: space.lg, paddingBottom: space.md },
  placeholder: { alignItems: 'center', gap: space.sm, paddingVertical: space.xxl, paddingHorizontal: space.xl },
  placeholderEmoji: { fontSize: 34 },
  placeholderText: { ...type.body, color: colors.textMuted, textAlign: 'center' },
  retry: { ...type.body, fontWeight: '800', color: colors.accent },
  comment: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...type.body, fontWeight: '800', color: colors.text },
  commentBody: { flex: 1, gap: 2 },
  commentMeta: { ...type.small, color: colors.textDim },
  commentText: { ...type.body, color: colors.text },
  error: { ...type.small, color: colors.like, textAlign: 'center', paddingHorizontal: space.xl },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: space.sm,
    paddingHorizontal: space.xl,
    paddingTop: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  input: {
    ...type.body,
    flex: 1,
    maxHeight: 120,
    color: colors.text,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  send: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
  },
  sendDisabled: { opacity: 0.4 },
});
