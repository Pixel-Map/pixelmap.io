// eslint-disable-next-line @typescript-eslint/no-var-requires
const pako = require('pako');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const base91 = require('node-base91');

// Decompress the Tile if it's compressed
export function decompressTileCode(tileCodeString) {
  if (typeof tileCodeString === 'string') {
    if (tileCodeString.startsWith('b#')) {
      // Using substring to remove the b#
      try {
        return pako.inflate(base91.decode(tileCodeString.substr(2)), {
          to: 'string',
        });
      } catch {
        console.log('Unable to deflate');
        return '';
      }
    } else {
      return tileCodeString.trim();
    }
  }
  return tileCodeString.trim();
}
