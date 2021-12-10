import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository, UseRequestContext } from '@mikro-orm/nestjs';
import { CurrentState, StatesToTrack } from '../ingestor/entities/currentState.entity';
import { EntityRepository, MikroORM, QueryOrder } from '@mikro-orm/core';
import { Cron } from '@nestjs/schedule';
import { DataHistory } from '../ingestor/entities/dataHistory.entity';
import { renderImage } from './utils/renderImage';
import { renderFullMap } from './utils/renderFullMap';
import { decompressTileCode } from './utils/decompressTileCode';
const S3SyncClient = require('s3-sync-client');
const mime = require('mime-types');
import { ConfigService } from '@nestjs/config';
import { Tile } from '../ingestor/entities/tile.entity';

@Injectable()
export class RendererService {
  private readonly logger = new Logger(RendererService.name);
  private currentlyReadingImages = false;

  constructor(
    @InjectRepository(CurrentState)
    private currentState: EntityRepository<CurrentState>,
    @InjectRepository(DataHistory)
    private dataHistory: EntityRepository<DataHistory>,
    @InjectRepository(Tile)
    private tileData: EntityRepository<Tile>,
    private readonly orm: MikroORM,
    private configService: ConfigService,
  ) {}

  @Cron('1 * * * * *', {
    name: 'renderImages',
  })
  @UseRequestContext()
  async renderImages() {
    if (!this.currentlyReadingImages) {
      const previousTiles = [];
      // Reload latest data
      const tiles = await this.tileData.find({}, [], { id: QueryOrder.ASC });
      for (let i = 0; i <= 3969; i++) {
        previousTiles[i] = tiles[i].image;
      }
      this.currentlyReadingImages = true;
      const lastEvent = await this.currentState.findOne({
        state: StatesToTrack.RENDERER_LAST_PROCESSED_DATA_CHANGE,
      });
      const tileDataChange = await this.dataHistory.find({}, ['tile'], { id: QueryOrder.ASC });
      for (let i = lastEvent.value; i < tileDataChange.length; i++) {
        const tileData = tileDataChange[i];
        if (previousTiles[tileData.tile.id] == tileData.image) {
          this.logger.verbose("Image didn't change, not re-rendering");
        } else {
          previousTiles[tileData.tile.id] = tileData.image;
          const imageData = decompressTileCode(tileData.image);

          if (imageData.length == 768) {
            this.logger.verbose('Saving image of tile: ' + tileData.tile.id);
            await renderImage(imageData, 'cache/' + tileData.tile.id + '/' + tileData.blockNumber + '.png');
            await renderImage(imageData, 'cache/' + tileData.tile.id + '/latest.png');
            await renderFullMap(previousTiles, 'cache/fullmap/' + tileData.blockNumber + '.png');
            this.logger.verbose(
              'Rendered image for tile: ' + tileData.tile.id + '(' + i + ' of ' + tileDataChange.length + ')',
            );
          }
        }
        lastEvent.value = i + 1;
      }
      await renderFullMap(previousTiles, 'cache/tilemap.png');

      const client = new S3SyncClient({
        region: 'us-east-1',
        credentials: {
          accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
          secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        },
      });
      if (this.configService.get<boolean>('SYNC_TO_AWS')) {
        this.logger.verbose('Syncing to AWS!');
        const sync = await client.sync('cache', 's3://pixelmap.art', {
          del: true,
          commandInput: {
            ContentType: (syncCommandInput) => mime.lookup(syncCommandInput.Key) || 'image/png',
          },
        });
        this.logger.verbose('Sync to AWS complete!');
      } else {
        this.logger.verbose('Skipping sync, SYNC_TO_AWS is false.');
      }
      await this.currentState.persistAndFlush(lastEvent);
      this.currentlyReadingImages = false;
    } else {
      this.logger.debug('Already rendering images, not starting again yet');
    }
  }
}
