import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkTheme, theme as lightTheme } from '@storybook/react-native';
import { view } from './storybook.requires';

const brandStyles = StyleSheet.create({
  text: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  wrapper: {
    alignItems: 'center',
    marginLeft: -16,
    width: '100%',
  },
});

// `brand.image` accepts a ReactElement (see StorybookLogo.tsx) — wrapping
// a functional component in JSX lets us use hooks so the label color
// tracks the system color scheme (and so does the rest of the Storybook
// chrome, which `getStorybookUI` auto-picks based on useColorScheme).
// The drawer container has paddingLeft: 16 (asymmetric); the negative
// marginLeft pulls our wrapper back to x=0 so alignItems: center measures
// against the true drawer width.
const BrandHeaderInner: React.FC = () => {
  const scheme = useColorScheme();
  const color =
    scheme === 'dark'
      ? darkTheme.color.defaultText
      : lightTheme.color.defaultText;
  return (
    <View style={brandStyles.wrapper}>
      <Text style={[brandStyles.text, { color }]}>Bubble UI Kit</Text>
    </View>
  );
};

const StorybookUIRoot = view.getStorybookUI({
  storage: {
    getItem: AsyncStorage.getItem,
    setItem: AsyncStorage.setItem,
  },
  theme: {
    brand: {
      image: <BrandHeaderInner />,
    },
  },
});

export default StorybookUIRoot;
