import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { SymbolView } from 'expo-symbols';
import { Colors, Typography, Spacing, Layout } from '../../constants/theme';
import { urlPreviewService, URLPreview } from '../../services/urlPreview';
import InputPreviewContainer from '../previews/InputPreviewContainer';

// Initialize preview system
import '../../services/urlPreview/setup';

interface InputBarProps {
  onSendMessage: (message: string, appleMusicUrl?: string) => void;
  keyboardVisible?: boolean;
  onHeightChange?: (height: number) => void;
  disabled?: boolean;
}

const InputBar: React.FC<InputBarProps> = ({
  onSendMessage,
  keyboardVisible = false,
  onHeightChange,
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [previews, setPreviews] = useState<URLPreview[]>([]);

  // Parse URLs for previews
  useEffect(() => {
    const parseURLs = async () => {
      if (message.trim() && previews.length === 0) {
        const detectedPreviews = await urlPreviewService.parseURL(message);
        if (detectedPreviews.length > 0) {
          setPreviews(detectedPreviews);

          // Clean URLs from message text
          const urls = urlPreviewService.extractURLs(message);
          const cleanedMessage = urlPreviewService.cleanTextFromURLs(
            message,
            urls
          );
          setMessage(cleanedMessage);
        }
      }
    };

    parseURLs();
  }, [message, previews.length]);

  const handleSend = () => {
    if ((message.trim() || previews.length > 0) && !disabled) {
      // For now, we'll pass the first preview's URL for backward compatibility
      // In the future, this could be enhanced to pass all preview data
      const appleMusicUrl = previews.find(p => p.type === 'appleMusic')?.url;
      onSendMessage(message.trim(), appleMusicUrl);
      setMessage('');
      setPreviews([]);
    }
  };

  const removePreview = (previewId: string) => {
    setPreviews(prev => prev.filter(p => p.id !== previewId));
  };

  return (
    <BlurView
      intensity={25}
      style={[
        styles.container,
        keyboardVisible && styles.containerKeyboardVisible,
      ]}
      onLayout={event => {
        const { height } = event.nativeEvent.layout;
        onHeightChange?.(height);
      }}
    >
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.addButton}>
          <SymbolView
            name='plus'
            size={16}
            type='hierarchical'
            tintColor={Colors.inputIcon}
            weight='regular'
          />
        </TouchableOpacity>

        <View
          style={[
            styles.textInputContainer,
            previews.length > 0 && styles.textInputContainerWithAttachment,
          ]}
        >
          {previews.map(preview => (
            <InputPreviewContainer
              key={preview.id}
              preview={preview}
              onRemove={() => removePreview(preview.id)}
            />
          ))}
          <TextInput
            style={[
              styles.textInput,
              previews.length > 0 && styles.textInputWithAttachment,
            ]}
            placeholder={previews.length > 0 ? '' : 'iMessage'}
            placeholderTextColor={Colors.placeholder}
            value={message}
            onChangeText={setMessage}
            multiline={true}
            maxLength={1000}
            returnKeyType='default'
            blurOnSubmit={false}
          />
          {!message.trim() && previews.length === 0 ? (
            <View style={styles.micIconContainer}>
              <SymbolView
                name='mic.fill'
                size={16}
                type='hierarchical'
                tintColor={Colors.micIcon}
                weight='regular'
              />
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.sendButton, disabled && styles.sendButtonDisabled]}
              onPress={handleSend}
              activeOpacity={disabled ? 1 : 0.7}
              disabled={disabled}
            >
              <SymbolView
                name='arrow.up'
                size={16}
                type='hierarchical'
                tintColor={Colors.white}
                weight='bold'
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  addButton: {
    alignItems: 'center',
    backgroundColor: Colors.addButtonBackground,
    borderRadius: Spacing.addButtonBorderRadius,
    height: Spacing.addButtonSize,
    justifyContent: 'center',
    width: Spacing.addButtonSize,
  },
  container: {
    backgroundColor: Colors.blurBackground,
    paddingBottom: Layout.inputPaddingBottom,
    paddingLeft: Spacing.inputPadding,
    paddingRight: Spacing.containerPadding,
    paddingTop: 6,
  },
  containerKeyboardVisible: {
    paddingBottom: Layout.inputPaddingBottomKeyboard + 2,
  },
  inputContainer: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 12,
  },
  micIconContainer: {
    alignItems: 'center',
    bottom: 10,
    height: Spacing.micIconContainerSize,
    justifyContent: 'center',
    marginTop: -Spacing.micIconContainerSize / 2,
    position: 'absolute',
    right: Spacing.micIconContainerRight,
    width: Spacing.micIconContainerSize,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: Colors.systemBlue,
    borderRadius: 13,
    bottom: 6,
    height: 26,
    justifyContent: 'center',
    marginTop: -13,
    position: 'absolute',
    right: 6,
    width: 26,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  textInput: {
    color: Colors.black,
    flex: 1,
    fontFamily: Typography.fontFamily,
    fontSize: Typography.input,
    letterSpacing: -0.68,
    lineHeight: Typography.inputLineHeight,
    minHeight: 20,
    paddingBottom: 0,
    paddingRight: 40,
    paddingTop: 0,
    textAlignVertical: 'top',
  },
  textInputContainer: {
    backgroundColor: Colors.inputBackground,
    borderColor: Colors.inputBorder,
    borderRadius: 20,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'column',
    minHeight: Spacing.inputHeight,
    paddingHorizontal: Spacing.inputPadding,
    paddingVertical: Spacing.inputPaddingVertical,
    position: 'relative',
  },
  textInputContainerWithAttachment: {
    minHeight: 100,
    paddingBottom: 4,
    paddingTop: 6,
  },
  textInputWithAttachment: {
    minHeight: 20,
    paddingBottom: 12,
    paddingTop: 0,
  },
});

export default InputBar;
