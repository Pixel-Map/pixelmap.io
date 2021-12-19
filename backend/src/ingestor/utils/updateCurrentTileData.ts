import { Contract, ethers } from 'ethers';
import { Logger } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { Tile } from '../entities/tile.entity';

export async function updateCurrentTileData(
  pixelMap: Contract,
  pixelMapWrapper: Contract,
  logger: Logger,
  tileRepo: EntityRepository<Tile>,
) {
  for (let i = 0; i < 3970; i++) {
    const tile = await tileRepo.findOne({ id: i });
    const tileData = await pixelMap.tiles(i);
    tile.owner = tileData.owner;
    tile.image = tileData.image;
    tile.url = tileData.url;
    tile.price = parseFloat(ethers.utils.formatEther(tileData.price));
    // let owner = previousData.owner;
    if (tile.owner == '0x0000000000000000000000000000000000000000') {
      tile.owner = '0x4f4b7e7edf5ec41235624ce207a6ef352aca7050';
    }
    if (tile.owner.toLowerCase() == '0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b'.toLowerCase()) {
      tile.owner = await pixelMapWrapper.ownerOf(i);
    }
    logger.verbose('Updating with current data for tile: ' + i);
    await tileRepo.persistAndFlush(tile);
  }
}
