import { MARIO_PALETTE, MARIO_ROM_SHA256, paintPixels, readMarioRom } from '../utils/marioPaint';
import { compressTileCode } from '../utils/ImageUtils';

describe('Mario Paint conversion', () => {
  test('preserves pixel order and maps primary colors to the game palette', () => {
    const pixels = paintPixels('f00' + '0f0' + '00f' + 'fff' + '000'.repeat(252));
    expect(pixels).toHaveLength(256);
    expect(pixels.slice(0, 5)).toEqual([0, 3, 6, 14, 11]);
  });
  test('uses existing PixelMap decompression for compressed artwork', () => {
    const raw = 'f00'.repeat(128) + '00f'.repeat(128);
    expect(paintPixels(compressTileCode(raw))).toEqual(paintPixels(raw));
  });
  test.each(['', '1', 'fff', 'ggg'.repeat(256), 'fff'.repeat(257)])('rejects malformed artwork case %#', image => {
    expect(() => paintPixels(image)).toThrow('valid 16 × 16');
  });
  test('approximates arbitrary RGB444 colors without transparent pixels', () => {
    const pixels = paintPixels(Array.from({ length: 256 }, (_, i) => (i * 13).toString(16).padStart(3, '0')).join(''));
    expect(pixels.every(index => index >= 0 && index < MARIO_PALETTE.length)).toBe(true);
  });
  test('rejects other file sizes before reading the ROM', async () => {
    await expect(readMarioRom(new File(['bad'], 'game.sfc'))).rejects.toThrow('Mario Paint');
  });
  test('rejects a different ROM even when its size matches', async () => {
    const digest = jest.fn().mockResolvedValue(new Uint8Array(32).buffer);
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: { digest } });
    const bytes = new ArrayBuffer(1048576);
    await expect(readMarioRom({ size: bytes.byteLength, arrayBuffer: async () => bytes } as File)).rejects.toThrow('different version');
  });
  test('strips a copier header before hashing and loading the supported ROM', async () => {
    const hash = Uint8Array.from(MARIO_ROM_SHA256.match(/../g)!, pair => parseInt(pair, 16));
    const digest = jest.fn().mockResolvedValue(hash.buffer);
    Object.defineProperty(crypto, 'subtle', { configurable: true, value: { digest } });
    const bytes = new Uint8Array(1049088);
    bytes[512] = 42;
    const result = await readMarioRom({ size: bytes.length, arrayBuffer: async () => bytes.buffer } as File);
    expect(result.byteLength).toBe(1048576);
    expect(new Uint8Array(result)[0]).toBe(42);
    expect(digest).toHaveBeenCalledWith('SHA-256', result);
  });
});
