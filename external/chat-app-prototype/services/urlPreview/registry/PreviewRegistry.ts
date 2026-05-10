import { ComponentType } from 'react';
import { PreviewComponentProps } from '../types';

// Registry for preview components
type PreviewComponentRegistry = {
  [previewType: string]: ComponentType<PreviewComponentProps>;
};

class PreviewRegistry {
  private components: PreviewComponentRegistry = {};

  registerComponent(
    type: string,
    component: ComponentType<PreviewComponentProps>
  ): void {
    this.components[type] = component;
  }

  getComponent(type: string): ComponentType<PreviewComponentProps> | null {
    return this.components[type] || null;
  }

  getAllTypes(): string[] {
    return Object.keys(this.components);
  }
}

// Export singleton instance
export const previewRegistry = new PreviewRegistry();
