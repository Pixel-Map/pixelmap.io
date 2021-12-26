import { Injectable } from '@nestjs/common';
import { Tile } from './ingestor/entities/tile.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, QueryOrder } from '@mikro-orm/core';
import { DataHistory } from './ingestor/entities/dataHistory.entity';
import { decompressTileCode } from './renderer/utils/decompressTileCode';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Tile)
    private tile: EntityRepository<Tile>,
    @InjectRepository(DataHistory)
    private dataHistory: EntityRepository<DataHistory>,
  ) {}

  public findAll(): Promise<Array<Tile>> {
    return this.tile.findAll();
  }
  async getFirstTilesWithImages() {
    const historyEvents = await this.dataHistory.findAll(['tile'], { time_stamp: QueryOrder.ASC });
    const tileAlreadyFound = new Map();
    let orderTileWasFound = 1;
    const timeCapsuleTiles = [];
    for (let i = 0; i < historyEvents.length; i++) {
      const event = historyEvents[i];
      if (isValidImage(event.image)) {
        if (tileAlreadyFound.has(event.tile.id)) {
        } else {
          tileAlreadyFound.set(event.tile.id, true);
          timeCapsuleTiles.push({
            tileId: event.tile.id,
            timeStamp: event.timeStamp,
            orderImageSetOnTile: orderTileWasFound,
            currentOwner: event.updatedBy,
            image: event.image,
          });
          orderTileWasFound++;
        }
      }
    }
    console.log(timeCapsuleTiles.length);
    return timeCapsuleTiles;
  }
}

function isValidImage(imgStr: string): boolean {
  if (decompressTileCode(imgStr).trim().length == 768) {
    return true;
  }
  return false;
}
