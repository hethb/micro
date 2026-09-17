import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

/** Semantic icon names mapped to SF Symbols (iOS) and Material Symbols (Android/web). */
const ICONS = {
  heart: { ios: 'heart.fill', android: 'favorite', web: 'favorite' },
  bookmark: { ios: 'bookmark.fill', android: 'bookmark', web: 'bookmark' },
  share: { ios: 'arrowshape.turn.up.right.fill', android: 'share', web: 'share' },
  more: { ios: 'ellipsis', android: 'more_horiz', web: 'more_horiz' },
  soundOn: { ios: 'speaker.wave.2.fill', android: 'volume_up', web: 'volume_up' },
  soundOff: { ios: 'speaker.slash.fill', android: 'volume_off', web: 'volume_off' },
  play: { ios: 'play.fill', android: 'play_arrow', web: 'play_arrow' },
  link: { ios: 'arrow.up.right', android: 'open_in_new', web: 'open_in_new' },
  close: { ios: 'xmark', android: 'close', web: 'close' },
  check: { ios: 'checkmark', android: 'check', web: 'check' },
  feed: { ios: 'play.rectangle.fill', android: 'smart_display', web: 'smart_display' },
  vault: { ios: 'books.vertical.fill', android: 'bookmarks', web: 'bookmarks' },
  me: { ios: 'person.crop.circle.fill', android: 'account_circle', web: 'account_circle' },
  book: { ios: 'book.fill', android: 'auto_stories', web: 'auto_stories' },
  settings: { ios: 'gearshape.fill', android: 'settings', web: 'settings' },
  back: { ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' },
  comment: { ios: 'bubble.right.fill', android: 'chat_bubble', web: 'chat_bubble' },
  send: { ios: 'arrow.up', android: 'send', web: 'send' },
  trash: { ios: 'trash', android: 'delete', web: 'delete' },
} as const satisfies Record<string, SymbolName>;

export type IconName = keyof typeof ICONS;

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
}

export function Icon({ name, size = 24, color = '#fff' }: IconProps) {
  return <SymbolView name={ICONS[name]} size={size} tintColor={color} />;
}
