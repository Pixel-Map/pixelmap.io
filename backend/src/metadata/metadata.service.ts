import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository, UseRequestContext } from '@mikro-orm/nestjs';
import { EntityRepository, MikroORM, QueryOrder } from '@mikro-orm/core';
import { Cron } from '@nestjs/schedule';
import { Tile } from '../ingestor/entities/tile.entity';

const fs = require('fs');
const S3SyncClient = require('s3-sync-client');
const mime = require('mime-types');
import { tileIsOnEdge } from './utils/tileIsOnEdge';
import { decompressTileCode } from '../renderer/utils/decompressTileCode';
import { tileIsInCenter } from './utils/tileIsInCenter';
import { getHistoricalImages } from './utils/getHistoricalImages';
import { Cache } from 'cache-manager';
import { PixelMapTile } from '@pixelmap/common/types/PixelMapTile';

@Injectable()
export class MetadataService {
  private readonly logger = new Logger(MetadataService.name);
  private currentlyGeneratingMetadata = false;

  constructor(
    @InjectRepository(Tile)
    private tileData: EntityRepository<Tile>,
    private readonly orm: MikroORM, // private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @Cron('5 * * * * *')
  @UseRequestContext()
  async renderMetadata() {
    if (!this.currentlyGeneratingMetadata) {
      this.currentlyGeneratingMetadata = true;

      const tiles = await this.tileData.find({}, ['dataHistory'], { id: QueryOrder.ASC });
      await this.generateTiledataJSON(tiles);

      this.currentlyGeneratingMetadata = false;
    } else {
      this.logger.debug('Already rendering metadata, not starting again yet');
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
        lastUpdated: new Date('December 13, 2021 01:01:00'), // todo: Implement last updated
        ens: tile.ens,
      });
    }
    await fs.writeFileSync('cache/tiledata.json', JSON.stringify(tiledataJSON, null, 2));
  }

  async updateTileMetadata(tile: Tile) {
    const tileMetaData = {
      description:
        'Official PixelMap Wrapped Tile.  Created in 2016, PixelMap is considered the second oldest NFT, the ' +
        'oldest verified collection on OpenSea, and provides the ability to create, display, and immortalize artwork ' +
        'directly on the blockchain.  All tiles can be viewed at https://pixelmap.io, and customized by the owner ' +
        '(image and URL are stored on-chain in the OG contract.  PixelMap was launched on November 17, 2016 - ' +
        'https://etherscan.io/address/0x015a06a433353f8db634df4eddf0c109882a15ab.  For more information, visit the ' +
        'Discord, at https://discord.pixelmap.io',
      external_url: tile.url,
      name: 'Tile #' + tile.id,
      attributes: [],
      image: '',
    };

    // Invisible (The very last tile)
    if (tile.id == 3969) {
      tileMetaData.attributes.push({
        value: 'Invisible',
      });
    }

    // Genesis Tile
    if (tile.id == 1984) {
      tileMetaData.attributes.push({
        value: 'Genesis',
      });
    }

    // Center ( tiles within 5 spaces of center tile aka the spider )
    if (tileIsInCenter(tile.id)) {
      tileMetaData.attributes.push({
        value: 'Center',
      });
    }

    // Corner
    if (tile.id == 0 || tile.id == 80 || tile.id == 3888 || tile.id == 3968) {
      tileMetaData.attributes.push({
        value: 'Corner',
      });
    }

    // Year Image first Updated
    const ogTiles = [
      0, 80, 574, 868, 1317, 1416, 1661, 1822, 1901, 1902, 1903, 1904, 1905, 1906, 1920, 1983, 1984, 1985, 1986, 1987,
      2063, 2064, 2065, 2066, 2067, 2068, 2145, 2146, 2147, 2226, 3968,
    ];
    if (ogTiles.includes(tile.id)) {
      tileMetaData.attributes.push({
        value: 'OG',
      });
    }

    // Edge
    if (tileIsOnEdge(tile.id)) {
      tileMetaData.attributes.push({
        value: 'Edge',
      });
    }

    const image = decompressTileCode(tile.image);

    if (image.length >= 768) {
      tileMetaData.image = 'https://pixelmap.art/' + tile.id + '/latest.png';
    } else {
      tileMetaData.image = 'https://pixelmap.art/blank.png';
    }

    // Write metadata for OpenSea
    const jsonMetaData = JSON.stringify(tileMetaData);

    const historical_images = getHistoricalImages(tile);
    // Create PixelMapTile API data
    const pixelMapTile: PixelMapTile = {
      id: tile.id,
      image: tile.image,
      url: tile.url,
      price: tile.price,
      owner: tile.owner,
      wrapped: tile.wrapped,
      openseaPrice: tile.openseaPrice,
      ens: tile.ens,
      historical_images: historical_images,
    };

    const previousMetadata = await this.cacheManager.get('metadata-' + String(tile.id));
    if (previousMetadata == jsonMetaData) {
      // this.logger.verbose("Not re-saving metadata, it's identical!");
    } else {
      await fs.writeFileSync('cache/metadata/' + tile.id + '.json', JSON.stringify(tileMetaData, null, 2));
      // Write data for /tile endpoint
      await fs.writeFileSync('cache/tile/' + tile.id + '.json', JSON.stringify(pixelMapTile, null, 2));
      await this.cacheManager.set('metadata-' + String(tile.id), jsonMetaData);
    }
  }
}
