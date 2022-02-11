import { Contract, ethers } from 'ethers';
import { Logger } from '@nestjs/common';
import { EntityRepository } from '@mikro-orm/core';
import { Tile } from '../entities/tile.entity';

export async function updateAllTileData(
  pixelMap: Contract,
  pixelMapWrapper: Contract,
  logger: Logger,
  tileRepo: EntityRepository<Tile>,
) {
  for (let i = 0; i < 3970; i++) {
    try {
      const tile = await tileRepo.findOne({ id: i });
      const updatedTileData = await getCurrentTileData(i, pixelMap, pixelMapWrapper);
      Object.assign(tile, updatedTileData);
      logger.verbose('Updating with current data for tile: ' + i);
      await tileRepo.persistAndFlush(tile);
    } catch (error) {
      console.log(error);
      logger.verbose('Unable to fetch current data,skipping!');
    }
  }
}

export async function getCurrentTileData(tileId: number, pixelMap: Contract, pixelMapWrapper: Contract) {
  const tileData = await pixelMap.tiles(tileId);
  return {
    image: tileData.image,
    url: tileData.url,
    price: parseFloat(ethers.utils.formatEther(tileData.price)),
    wrapped: isWrapped(tileData.owner),
    owner: await getOwner(tileData.owner, tileId, pixelMapWrapper),
  };
}

// Returns true if the tile is wrapped
function isWrapped(owner: string) {
  return owner.toLowerCase() == '0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b';
}

// getOwner returns the real owner of a given tile.
async function getOwner(owner: string, tileId: number, pixelMapWrapper) {
  // If never owned before, then owned by the creator of the contract
  switch (owner.toLowerCase()) {
    case '0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b':
      return await pixelMapWrapper.ownerOf(tileId);
    case '0x0000000000000000000000000000000000000000':
      return '0x4f4b7e7edf5ec41235624ce207a6ef352aca7050';
    default:
      return owner;
  }
}
