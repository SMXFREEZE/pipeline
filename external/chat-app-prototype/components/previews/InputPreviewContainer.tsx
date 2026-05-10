import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { URLPreview } from '../../services/urlPreview/types';
import { previewRegistry } from '../../services/urlPreview';
import { Colors } from '../../constants/theme';

interface InputPreviewContainerProps {
  preview: URLPreview;
  onRemove: () => void;
}

const InputPreviewContainer: React.FC<InputPreviewContainerProps> = ({
  preview,
  onRemove,
}) => {
  const PreviewComponent = previewRegistry.getComponent(preview.type);

  if (!PreviewComponent) {
    console.warn(`No preview component registered for type: ${preview.type}`);
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.previewWrapper}>
        <PreviewComponent
          preview={preview}
          isSender={false}
          isLastInGroup={false}
          maxWidth='85%'
          playDisabled={true}
          onRemove={onRemove}
        />
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={styles.removeButtonBackground}>
            <SymbolView
              name='xmark'
              size={10}
              type='hierarchical'
              tintColor={Colors.inputIcon}
              weight='bold'
            />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    paddingBottom: 12,
    paddingTop: 4,
  },
  previewWrapper: {
    alignSelf: 'flex-start',
    position: 'relative',
  },
  removeButton: {
    position: 'absolute',
    right: 8,
    top: 8,
    zIndex: 10,
  },
  removeButtonBackground: {
    alignItems: 'center',
    backgroundColor: Colors.blurBackground,
    borderColor: Colors.white,
    borderRadius: 9,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
});

export default InputPreviewContainer;
