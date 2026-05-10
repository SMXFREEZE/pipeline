import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Colors, Spacing } from '../../constants/theme';

interface GroupAvatarProps {
  avatars: any[];
}

const GroupAvatar: React.FC<GroupAvatarProps> = ({ avatars }) => {
  return (
    <View style={styles.groupAvatarContainer}>
      <View style={styles.groupBackground} />
      <View style={styles.groupAvatar1}>
        <Image
          source={avatars[0] || require('../../assets/profile-photos/Ruth.png')}
          style={styles.groupAvatarImage1}
          resizeMode='cover'
        />
      </View>
      <View style={styles.groupAvatar2}>
        <Image
          source={avatars[1] || require('../../assets/profile-photos/Gus.png')}
          style={styles.groupAvatarImage2}
          resizeMode='cover'
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  groupAvatar1: {
    alignItems: 'center',
    backgroundColor: Colors.avatarPlaceholder,
    borderColor: Colors.white,
    borderRadius: Spacing.groupAvatar1BorderRadius,
    borderWidth: 1.5,
    height: Spacing.groupAvatar1Size,
    justifyContent: 'center',
    left: Spacing.groupAvatar1Position,
    position: 'absolute',
    top: Spacing.groupAvatar1Position,
    width: Spacing.groupAvatar1Size,
  },
  groupAvatar2: {
    alignItems: 'center',
    backgroundColor: Colors.avatarPlaceholder,
    borderColor: Colors.white,
    borderRadius: Spacing.groupAvatar2BorderRadius,
    borderWidth: 1,
    bottom: Spacing.groupAvatar2Position,
    height: Spacing.groupAvatar2Size,
    justifyContent: 'center',
    position: 'absolute',
    right: Spacing.groupAvatar2Position,
    width: Spacing.groupAvatar2Size,
  },
  groupAvatarContainer: {
    height: Spacing.avatarSize,
    position: 'relative',
    width: Spacing.avatarSize,
  },
  groupAvatarImage1: {
    borderRadius: Spacing.groupAvatar1BorderRadius,
    height: Spacing.groupAvatar1Size,
    width: Spacing.groupAvatar1Size,
  },
  groupAvatarImage2: {
    borderRadius: Spacing.groupAvatar2BorderRadius,
    height: Spacing.groupAvatar2Size,
    width: Spacing.groupAvatar2Size,
  },
  groupBackground: {
    backgroundColor: Colors.groupAvatarBackground,
    borderRadius: Spacing.avatarBorderRadius,
    height: Spacing.avatarSize,
    position: 'absolute',
    width: Spacing.avatarSize,
  },
});

export default GroupAvatar;
