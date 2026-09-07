import { decompressTileCode } from './ImageUtils';

// Compare decoded RGB pixels, independent of compression format or hex case.
// Missing or invalid artwork has no meaningful percentage comparison.
export function countPixelDifferences(left?: string, right?: string): number | null {
  const a = decompressTileCode(left);
  const b = decompressTileCode(right);
  if (typeof a !== 'string' || typeof b !== 'string' ||
      !/^[0-9a-f]{768}$/i.test(a) || !/^[0-9a-f]{768}$/i.test(b)) return null;
  let count = 0;
  for (let i = 0; i < 768; i += 3) {
    if (a.slice(i, i + 3).toLowerCase() !== b.slice(i, i + 3).toLowerCase()) count++;
  }
  return count;
}
