import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository, UseRequestContext } from '@mikro-orm/nestjs';
import { EntityRepository, MikroORM, QueryOrder } from '@mikro-orm/core';
import { Cron } from '@nestjs/schedule';
import { Tile } from '../ingestor/entities/tile.entity';
const fs = require('fs');
const S3SyncClient = require('s3-sync-client');
const mime = require('mime-types');
import { tileIsOnEdge } from '../renderer/utils/tileIsOnEdge';

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);
  private currentlyGeneratingMetadata = false;

  constructor(
    @InjectRepository(Tile)
    private tileData: EntityRepository<Tile>,
    private readonly orm: MikroORM, // private configService: ConfigService,
  ) {}

  @Cron('1 * * * * *', {
    name: 'generateMetadata',
  })
  @UseRequestContext()
  async renderImages() {
    if (!this.currentlyGeneratingMetadata) {
      this.currentlyGeneratingMetadata = true;

      const tiles = await this.tileData.find({}, [], { id: QueryOrder.ASC });
      const tileJSONData = await this.generateTiledataJSON(tiles);

      this.currentlyGeneratingMetadata = false;
    } else {
      this.logger.debug('Already rendering images, not starting again yet');
    }
  }

  async generateTiledataJSON(tiles: Tile[]) {
    this.logger.verbose('Generating tiledata.json');
    const tiledataJSON = [];
    for (let i = 0; i <= 3969; i++) {
      const tile = tiles[i];
      await this.updateTileMetadata(tile);
      tiledataJSON.push({
        id: tile.id,
        url: tile.url,
        image: tile.image,
        owner: tile.owner,
        price: tile.price,
        wrapped: tile.wrapped,
        openseaPrice: tile.openseaPrice,
        lastUpdated: Date.now(),
        ens: tile.ens,
      });
    }
    await fs.writeFileSync('cache/tiledata.json', JSON.stringify(tiledataJSON, null, 2));
  }

  async updateTileMetadata(tile: Tile) {
    const tileMetaData = {
      description: 'Official PixelMap (2016) Wrapped Tile',
      external_url: tile.url,
      name: 'Tile #' + tile.id,
      attributes: [],
      image: '',
    };

    if (tileIsOnEdge(tile.id)) {
      tileMetaData.attributes.push({
        value: 'Edge',
      });
    }

    if (tile.image.length >= 768) {
      tileMetaData.image = 'https://pixelmap.art/' + tile.id + '/latest/.png';
    } else {
      tileMetaData.image = 'https://pixelmap.art/blank.png';
    }
    await fs.writeFileSync('cache/metadata/' + tile.id + '.json', JSON.stringify(tileMetaData, null, 2));
  }
}
