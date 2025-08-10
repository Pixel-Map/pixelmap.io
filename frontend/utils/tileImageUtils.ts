/**
 * Get the large image URL for a PixelMap tile
 * Format: http://pixelmap.art/000/large.png where 000 is the tile number
 */
export const getLargeImageUrl = (tileId: number | string): string => {
  const paddedId = String(tileId).padStart(3, '0');
  return `https://pixelmap.art/${paddedId}/large.png`;
};

/**
 * Get the latest image URL (fallback)
 */
export const getLatestImageUrl = (tileId: number | string): string => {
  return `https://pixelmap.art/${tileId}/latest.png`;
};

/**
 * Get the best available image URL with fallback
 */
export const getBestImageUrl = (tileId: number | string): string => {
  // Try large format first, with fallback to latest
  return getLargeImageUrl(tileId);
};