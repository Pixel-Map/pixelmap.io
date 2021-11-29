import { decompressTileCode } from './decompressTileCode';

it('successfully decodes a Pako compressed Base91 string', async () => {
  const compressedImage = 'b#I@7zT^0v|%}+FkCpewvANJ:NIA';
  expect(decompressTileCode(compressedImage)).toBe('Waffles');
});
