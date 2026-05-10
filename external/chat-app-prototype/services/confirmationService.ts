import { Alert } from 'react-native';
import { musicPreloader } from '../utils/musicPreloader';
import { resetEmitter } from '../utils/resetEmitter';

interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  onConfirm: () => void;
  destructive?: boolean;
}

const showConfirmation = ({
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  onConfirm,
  destructive = false,
}: ConfirmationOptions) => {
  Alert.alert(
    title,
    message,
    [
      {
        text: cancelText,
        style: 'cancel',
      },
      {
        text: confirmText,
        style: destructive ? 'destructive' : 'default',
        onPress: onConfirm,
      },
    ],
    { cancelable: true }
  );
};

export const showResetConfirmation = (
  clearAllChats: () => void,
  resetApp: () => void,
  setPendingChatUpdate: (update: any) => void
) => {
  showConfirmation({
    title: 'Reset prototype?',
    message:
      'This will reset all conversations to their original state and clear any new messages.',
    confirmText: 'Reset',
    destructive: true,
    onConfirm: () => {
      // Clear the pending update and reset chats
      setPendingChatUpdate(undefined);
      clearAllChats();
      resetApp();
      // Clear music preloader cache
      musicPreloader.clearCache();
      // Emit reset event
      resetEmitter.emit();
    },
  });
};
