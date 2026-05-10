// Album art dimensions used throughout the app
const ALBUM_ART_SIZE = 200;

/**
 * Formats an Apple Music artwork URL with the correct dimensions
 * Uses Cloudinary as an image proxy to improve reliability
 */
export function formatArtworkUrl(url: string): string {
  if (!url) return '';

  let formattedUrl = url;

  // Check if URL contains template placeholders
  if (url.includes('{w}') && url.includes('{h}')) {
    // Replace placeholders with actual dimensions
    formattedUrl = url
      .replace('{w}', String(ALBUM_ART_SIZE))
      .replace('{h}', String(ALBUM_ART_SIZE))
      .replace('{f}', 'jpg');
  } else {
    // Check if URL already has dimensions (e.g., "100x100bb.jpg")
    const dimensionPattern = /\/(\d+)x(\d+)bb\.jpg$/;
    if (dimensionPattern.test(url)) {
      // Replace existing dimensions with our standard size
      formattedUrl = url.replace(
        dimensionPattern,
        `/${ALBUM_ART_SIZE}x${ALBUM_ART_SIZE}bb.jpg`
      );
    } else {
      // URL doesn't match expected patterns, use as-is
      console.warn('Unexpected artwork URL format:', url);
      formattedUrl = url;
    }
  }

  // Use Cloudinary as a proxy to improve reliability
  // This helps with CORS issues and provides better caching
  const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
  const cloudinaryUrl = `https://res.cloudinary.com/${cloudName}/image/fetch/w_${ALBUM_ART_SIZE},h_${ALBUM_ART_SIZE},c_fill,f_auto,q_auto/${encodeURIComponent(
    formattedUrl
  )}`;

  console.log(`🖼️ Using Cloudinary proxy: ${cloudinaryUrl}`);
  return cloudinaryUrl;
}
