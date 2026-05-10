import React from 'react';
import { render } from '@testing-library/react-native';
import { Text, View } from 'react-native';

// Example test to verify Jest is working
describe('Example Test Suite', () => {
  it('should render a simple component', () => {
    const TestComponent = () => (
      <View>
        <Text>Hello World</Text>
      </View>
    );

    const { getByText } = render(<TestComponent />);
    expect(getByText('Hello World')).toBeTruthy();
  });

  it('should pass basic assertions', () => {
    expect(1 + 1).toBe(2);
    expect('hello').toBe('hello');
    expect([1, 2, 3]).toHaveLength(3);
  });
});
