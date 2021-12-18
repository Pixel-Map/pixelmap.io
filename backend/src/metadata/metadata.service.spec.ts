import { MetadataService } from './metadata.service';
const fs = require('fs');

describe('MetadataService', () => {
  const invisibleTiles = [];
  const genesisTiles = [];
  const centerTiles = [];
  const cornerTiles = [];
  const ogTiles = [];
  const edgeTiles = [];
  for (let i = 0; i < 3970; i++) {
    const rawdata = fs.readFileSync('cache/metadata/' + i + '.json');
    const tileData = JSON.parse(rawdata);

    if (tileData.attributes.some((e) => e.value === 'Invisible')) {
      invisibleTiles.push(i);
    }
    if (tileData.attributes.some((e) => e.value === 'Genesis')) {
      genesisTiles.push(i);
    }
    if (tileData.attributes.some((e) => e.value === 'Center')) {
      centerTiles.push(i);
    }
    if (tileData.attributes.some((e) => e.value === 'Corner')) {
      cornerTiles.push(i);
    }
    if (tileData.attributes.some((e) => e.value === 'OG')) {
      ogTiles.push(i);
    }
    if (tileData.attributes.some((e) => e.value === 'Edge')) {
      edgeTiles.push(i);
    }
  }
  it('successfully renders the right number of special attributes', async () => {
    expect(invisibleTiles.length).toBe(1);
    expect(genesisTiles.length).toBe(1);
    expect(centerTiles.length).toBe(121);
    expect(cornerTiles.length).toBe(4);
    expect(ogTiles.length).toBe(31);
    expect(edgeTiles.length).toBe(257);
  });
});
