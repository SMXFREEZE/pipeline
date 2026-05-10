import React from 'react';
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import type { StoryContext } from '@storybook/react';
import { Colors, Typography } from '../constants/theme';
import { PositionControlWrapper } from './components/PositionControlWrapper';

// Match Storybook's dark-theme chrome color (the layer that paints behind
// the status bar via insets.top). Value comes from
// @storybook/react-native-theming's darkTheme.background.content.
const STORYBOOK_DARK_BG = '#1B1C1D';
const STORYBOOK_DARK_BORDER = 'rgba(255,255,255,0.1)';

const decoratorStyles = StyleSheet.create({
  canvasDark: {
    backgroundColor: Colors.black,
    flex: 1,
  },
  canvasLight: {
    backgroundColor: Colors.white,
    flex: 1,
  },
  darkBackground: {
    backgroundColor: STORYBOOK_DARK_BG,
  },
  header: {
    alignItems: 'center',
    borderBottomColor: Colors.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    paddingBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  headerDark: {
    backgroundColor: STORYBOOK_DARK_BG,
    borderBottomColor: STORYBOOK_DARK_BORDER,
  },
  headerTitle: {
    color: Colors.black,
    fontFamily: Typography.fontFamily,
    fontSize: 15,
    fontWeight: Typography.medium,
  },
  headerTitleDark: {
    color: Colors.white,
  },
  lightBackground: {
    backgroundColor: Colors.white,
  },
  screenContainer: {
    flex: 1,
  },
});

// Hooks must live in a component — decorators themselves are plain
// functions that Storybook invokes, so we read useColorScheme here.
const DecoratorBody: React.FC<{
  Story: React.ComponentType<Record<string, unknown>>;
  storyArgs: Record<string, unknown>;
  title: string;
  darkModeOverride: boolean;
}> = ({ Story, storyArgs, title, darkModeOverride }) => {
  const scheme = useColorScheme();
  const isDarkMode = darkModeOverride || scheme === 'dark';

  return (
    <View
      style={[
        decoratorStyles.screenContainer,
        isDarkMode
          ? decoratorStyles.darkBackground
          : decoratorStyles.lightBackground,
      ]}
    >
      <SafeAreaView style={decoratorStyles.screenContainer}>
        <View
          style={[
            decoratorStyles.header,
            isDarkMode && decoratorStyles.headerDark,
          ]}
        >
          <Text
            style={[
              decoratorStyles.headerTitle,
              isDarkMode && decoratorStyles.headerTitleDark,
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
        </View>
        <View
          style={
            isDarkMode
              ? decoratorStyles.canvasDark
              : decoratorStyles.canvasLight
          }
        >
          <PositionControlWrapper>
            <Story {...storyArgs} />
          </PositionControlWrapper>
        </View>
      </SafeAreaView>
    </View>
  );
};

export const CenteredDecorator = (
  Story: React.ComponentType<Record<string, unknown>>,
  context: StoryContext
) => {
  const { darkMode, ...storyArgs } = context.args;
  const componentName = context.title.split('/').pop() || 'Component';
  const storyName = context.name;
  const title = `${componentName} | ${storyName}`;

  return (
    <DecoratorBody
      Story={Story}
      storyArgs={storyArgs}
      title={title}
      darkModeOverride={Boolean(darkMode)}
    />
  );
};
