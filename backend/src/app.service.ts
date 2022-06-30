import { Injectable } from '@nestjs/common';
import { Tile } from './ingestor/entities/tile.entity';
import { InjectRepository } from '@mikro-orm/nestjs';
import { EntityRepository, QueryOrder } from '@mikro-orm/core';
import { DataHistory } from './ingestor/entities/dataHistory.entity';
import { decompressTileCode } from './renderer/utils/decompressTileCode';
import { PurchaseHistory } from './ingestor/entities/purchaseHistory.entity';

@Injectable()
export class AppService {
  constructor(
    @InjectRepository(Tile)
    private tile: EntityRepository<Tile>,
    @InjectRepository(DataHistory)
    private dataHistory: EntityRepository<DataHistory>,
    @InjectRepository(PurchaseHistory)
    private purchaseHistory: EntityRepository<PurchaseHistory>,
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

  async allImages() {
    const historyEvents = await this.dataHistory.findAll(['tile'], { time_stamp: QueryOrder.ASC });
    const lastTileImage = new Map();

    // Initialize Map
    for (let i = 0; i <= 3970; i++) {
      lastTileImage.set(i, false);
    }

    let orderTileWasFound = 1;
    const allImages = [];
    for (let i = 0; i < historyEvents.length; i++) {
      const event = historyEvents[i];
      if (lastTileImage.get(event.tile.id) == event.image) {
      } else {
        if (isValidImage(event.image)) {
          lastTileImage.set(event.tile.id, event.image);
          allImages.push({
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
    return allImages;
  }

  async getOgOwners() {
    const purchaseEvents = await this.purchaseHistory.findAll();
    const openSeaListDate = new Date('2021-8-27');

    const resultProductData = purchaseEvents.filter((a) => {
      const date = new Date(a.timeStamp);
      return date <= openSeaListDate;
    });
    const unique = [...new Set(resultProductData.map((tile) => tile.purchasedBy))];
    console.log(unique.length);

    return unique;
  }

  async getOwners() {
    const tiles = await this.tile.findAll();
    const unique = [...new Set(tiles.map((tile) => tile.owner))];
    console.log('Number of Owners: ' + unique.length);
    return unique;
  }
}

function isValidImage(imgStr: string): boolean {
  if (decompressTileCode(imgStr).trim().length == 768) {
    return true;
  }
  return false;
}
