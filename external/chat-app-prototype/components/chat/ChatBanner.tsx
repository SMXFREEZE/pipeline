import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Typography, Spacing } from '../../constants/theme';

type ChatBannerType = 'timestamp' | 'date' | 'notification' | 'system';

interface ChatBannerProps {
  type?: ChatBannerType;
  content: string;
  // Optional props for specific banner types
  showTime?: boolean; // For timestamp type
}

const ChatBanner: React.FC<ChatBannerProps> = ({
  type = 'timestamp',
  content,
  showTime = true,
}) => {
  const renderContent = () => {
    switch (type) {
      case 'timestamp': {
        // Split timestamp into day and time parts
        const parts = content.split(' ');
        const dayPart = parts[0]; // "Monday"
        const timePart = parts.slice(1).join(' '); // "2:14 PM"

        return (
          <Text style={styles.text}>
            <Text style={styles.dayText}>{dayPart}</Text>
            {showTime && timePart && (
              <Text style={styles.timeText}> at {timePart}</Text>
            )}
          </Text>
        );
      }
      case 'date':
        return <Text style={styles.text}>{content}</Text>;
      case 'notification':
        return (
          <Text style={[styles.text, styles.notificationText]}>{content}</Text>
        );
      case 'system':
        return <Text style={[styles.text, styles.systemText]}>{content}</Text>;
      default:
        return <Text style={styles.text}>{content}</Text>;
    }
  };

  return (
    <View
      style={[
        styles.container,
        type === 'notification' && styles.notificationContainer,
      ]}
    >
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: Spacing.timestampMargin,
  },
  dayText: {
    fontFamily: 'System',
    fontWeight: Typography.medium,
  },
  notificationContainer: {
    backgroundColor: Colors.messageBubbleGray,
    borderRadius: 12,
    marginHorizontal: 40,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  notificationText: {
    fontSize: 13,
  },
  systemText: {
    fontStyle: 'italic',
  },
  text: {
    color: Colors.textSecondary,
    fontSize: Typography.timestamp,
    lineHeight: Typography.timestampLineHeight,
  },
  timeText: {
    fontFamily: 'System',
    fontWeight: Typography.regular,
  },
});

export default ChatBanner;
