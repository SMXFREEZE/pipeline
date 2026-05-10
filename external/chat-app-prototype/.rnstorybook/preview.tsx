import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      // Debounce control updates to reduce re-renders
      debounce: 200,
    },
  },
};

export default preview;
