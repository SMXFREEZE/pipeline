import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';

interface UserAvatarProps {
  avatar?: any;
}

const UserAvatar: React.FC<UserAvatarProps> = ({ avatar }) => {
  return (
    <View style={styles.persona}>
      <View style={styles.avatar}>
        <Image
          source={avatar || require('../../assets/profile-photos/Ruth.png')}
          style={styles.avatarImage}
          resizeMode='cover'
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: Colors.avatarPlaceholder,
    borderRadius: Spacing.avatarBorderRadius,
    flexBasis: 0,
    flexGrow: 1,
    flexShrink: 0,
    height: Spacing.avatarSize,
    justifyContent: 'center',
    minHeight: 1,
    minWidth: 1,
    width: Spacing.avatarSize,
  },
  avatarImage: {
    borderRadius: Spacing.avatarBorderRadius,
    height: Spacing.avatarSize,
    width: Spacing.avatarSize,
  },
  persona: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.chatItemContainerGap,
    height: Spacing.avatarSize,
    justifyContent: 'flex-start',
    padding: 0,
    width: Spacing.avatarSize,
  },
});

export default UserAvatar;
