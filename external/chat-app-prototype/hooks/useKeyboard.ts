import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

interface UseKeyboardReturn {
  keyboardVisible: boolean;
  keyboardAnimatedStyle: ReturnType<typeof useAnimatedStyle>;
}

export const useKeyboard = (): UseKeyboardReturn => {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // Reanimated keyboard for frame-by-frame tracking (input bar interactive dismiss + positioning)
  const keyboard = useAnimatedKeyboard();
  const keyboardAnimatedStyle = useAnimatedStyle(() => ({
    bottom: keyboard.height.value,
  }));

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });

    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
    });

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  return { keyboardVisible, keyboardAnimatedStyle };
};
