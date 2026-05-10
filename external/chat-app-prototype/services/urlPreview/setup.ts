// Setup file to register all preview components
import { previewRegistry } from './registry/PreviewRegistry';
import AppleMusicPreview from '../../components/previews/AppleMusicPreview';

// Register all preview components
previewRegistry.registerComponent('appleMusic', AppleMusicPreview);

// Future components can be registered here
// previewRegistry.registerComponent('youtube', YouTubePreview);
// previewRegistry.registerComponent('spotify', SpotifyPreview);
