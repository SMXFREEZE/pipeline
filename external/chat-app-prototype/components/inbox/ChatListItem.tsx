import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Colors, Typography, Spacing } from '../../constants/theme';
import GroupAvatar from '../avatars/GroupAvatar';
import UserAvatar from '../avatars/UserAvatar';
import { ChatItem } from '../../data/inbox';

interface ChatListItemProps {
  item: ChatItem;
  onPress: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ item, onPress }) => {
  return (
    <View style={styles.inboxRow}>
      <View style={styles.divider} />
      {item.unread && <View style={styles.unreadIndicator} />}
      <TouchableOpacity
        style={styles.messageContainer}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.inboxRowPhoto}>
          {item.isGroup ? (
            <GroupAvatar avatars={item.groupAvatars || []} />
          ) : (
            <UserAvatar avatar={item.avatar} />
          )}
        </View>
        <View style={styles.textContainer}>
          <View style={styles.nameTimeContainer}>
            <Text style={styles.name} numberOfLines={1}>
              {item.name}
            </Text>
            <View style={styles.timeContainer}>
              <Text style={styles.time}>{item.timestamp}</Text>
              <SymbolView
                name='chevron.right'
                size={Spacing.chevronSize}
                type='hierarchical'
                tintColor={Colors.placeholder}
                weight='semibold'
                style={styles.chevron}
              />
            </View>
          </View>
          <Text style={styles.preview} numberOfLines={2}>
            {item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  chevron: {
    alignItems: 'center',
    flexShrink: 0,
    height: 20,
    justifyContent: 'center',
    width: 10,
  },
  divider: {
    backgroundColor: Colors.border,
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  inboxRow: {
    backgroundColor: Colors.chatItemBackground,
    flexDirection: 'column',
    gap: Spacing.chatItemRowGap,
    paddingBottom: Spacing.chatItemRowPaddingBottom,
    paddingLeft: Spacing.chatItemRowPaddingLeft,
    paddingRight: 0,
    paddingTop: 0,
    position: 'relative',
  },
  inboxRowPhoto: {
    borderRadius: Spacing.avatarBorderRadius,
    height: Spacing.avatarSize,
    overflow: 'hidden',
    width: Spacing.avatarSize,
  },
  messageContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.chatItemContainerGap,
    paddingLeft: 0,
    paddingRight: Spacing.chatItemContainerPaddingRight,
    paddingVertical: 0,
  },
  name: {
    color: Colors.black,
    flexShrink: 0,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.input,
    fontWeight: '600',
    letterSpacing: -0.6,
    lineHeight: Typography.chatItemNameLineHeight,
    maxWidth: Spacing.nameMaxWidth,
    overflow: 'hidden',
  },
  nameTimeContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 0,
    width: '100%',
  },
  preview: {
    color: Colors.textTertiary,
    flexShrink: 0,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.chatItemPreview,
    fontWeight: Typography.regular,
    letterSpacing: -0.4,
    lineHeight: Typography.messageLineHeight,
    overflow: 'hidden',
    width: '95%',
  },
  textContainer: {
    alignItems: 'flex-start',
    flex: 1,
    flexBasis: 0,
    flexDirection: 'column',
    flexGrow: 1,
    flexShrink: 0,
    justifyContent: 'flex-start',
    minHeight: 62,
    minWidth: 1,
    padding: 0,
  },
  time: {
    color: Colors.textTertiary,
    flexShrink: 0,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.chatItemPreview,
    fontWeight: Typography.regular,
    letterSpacing: -0.7,
    lineHeight: Typography.messageLineHeight,
    textAlign: 'right',
    width: 90,
  },
  timeContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    gap: Spacing.chatItemContainerGap,
    justifyContent: 'flex-end',
    paddingBottom: 0,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 2,
    width: Spacing.timeContainerWidth,
  },
  unreadIndicator: {
    backgroundColor: Colors.systemBlue,
    borderRadius: Spacing.unreadIndicatorBorderRadius,
    height: Spacing.unreadIndicatorSize,
    left: Spacing.unreadIndicatorLeft,
    position: 'absolute',
    top: Spacing.unreadIndicatorTop,
    width: Spacing.unreadIndicatorSize,
  },
});

export default ChatListItem;
