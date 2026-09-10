import { decompressTileCode } from './ImageUtils';

// Sampled from the real game's palette with the bundled Snes9x core.
export const MARIO_PALETTE = [
  [255, 0, 0], [255, 134, 0], [255, 255, 0], [0, 255, 0],
  [0, 134, 66], [0, 255, 255], [0, 0, 255], [198, 65, 33],
  [132, 97, 0], [255, 199, 132], [198, 0, 198], [0, 0, 0],
  [132, 134, 132], [198, 199, 198], [255, 255, 255],
] as const;

export const MARIO_ROM_SHA256 = 'e842cac1a4301be196f1e137fbd1a16866d5c913f24dbca313f4dd8bd7472f45';

export function paintPixels(image: string): number[] {
  const raw = decompressTileCode(image);
  if (typeof raw !== 'string' || !/^[a-f\d]{768}$/i.test(raw)) {
    throw new Error('This tile does not have a valid 16 × 16 image yet.');
  }
  return Array.from({ length: 256 }, (_, i) => {
    const rgb = raw.slice(i * 3, i * 3 + 3).split('').map(c => parseInt(c, 16) * 17);
    let nearest = 0;
    let distance = Infinity;
    MARIO_PALETTE.forEach((color, index) => {
      // Weight green most heavily to preserve perceived lightness.
      const d = 2 * (rgb[0] - color[0]) ** 2 + 4 * (rgb[1] - color[1]) ** 2 + 3 * (rgb[2] - color[2]) ** 2;
      if (d < distance) { distance = d; nearest = index; }
    });
    return nearest;
  });
}

export async function readMarioRom(file: File): Promise<ArrayBuffer> {
  if (![1048576, 1049088].includes(file.size)) {
    throw new Error('Choose the Mario Paint (Japan, USA) .sfc or .smc ROM.');
  }
  let bytes = await file.arrayBuffer();
  if (bytes.byteLength === 1049088) bytes = bytes.slice(512);
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  if (hash !== MARIO_ROM_SHA256) {
    throw new Error('This drawing sequence needs the original Mario Paint (Japan, USA) ROM. This file is a different version.');
  }
  return bytes;
}
