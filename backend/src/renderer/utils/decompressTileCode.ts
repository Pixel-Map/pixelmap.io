import pako from 'pako';
import base91 from 'node-base91';

// Decompress the Tile if it's compressed
export function decompressTileCode(tileCodeString) {
  console.log(pako);
  if (typeof tileCodeString === 'string') {
    if (tileCodeString.startsWith('b#')) {
      // Using substring to remove the b#
      return pako.inflate(base91.decode(tileCodeString.substr(2)), {
        to: 'string',
      });
    } else {
      return tileCodeString;
    }
  }
  return tileCodeString;
}
