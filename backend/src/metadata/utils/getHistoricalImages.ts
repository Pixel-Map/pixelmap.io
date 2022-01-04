import { Tile } from '../../ingestor/entities/tile.entity';
import { PixelMapImage } from '@pixelmap/common/types/PixelMapImage';

export function getHistoricalImages(tile: Tile) {
  const _imagesAlreadySeen = [];
  const historical_images: PixelMapImage[] = [];
  for (const dataHistory of tile.dataHistory) {
    if (dataHistory.image.length >= 768 && !_imagesAlreadySeen.includes(dataHistory.image)) {
      _imagesAlreadySeen.push(dataHistory.image);
      historical_images.push({
        blockNumber: dataHistory.blockNumber,
        date: dataHistory.timeStamp,
        image: dataHistory.image,
        image_url: 'https://pixelmap.art/' + tile.id + '/' + dataHistory.blockNumber + '.png',
      });
    }
  }
  return historical_images;
}
