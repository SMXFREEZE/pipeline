import { registerRootComponent } from 'expo';

// Check if we should load Storybook via environment variable
const enableStorybook = process.env.EXPO_PUBLIC_STORYBOOK_ENABLED === 'true';

if (enableStorybook) {
  // Load Storybook
  const StorybookUI = require('./.rnstorybook').default;
  registerRootComponent(StorybookUI);
} else {
  // Load the main app
  const App = require('./App').default;
  registerRootComponent(App);
}
