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

  @Cron('1 * * * * *')
  @UseRequestContext()
  async renderImages() {
    if (!this.currentlyReadingImages) {
      try {
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
              await renderFullMap(previousTiles, 'cache/fullmap/' + tileData.blockNumber + '.png');
              this.logger.verbose(
                'Rendered image for tile: ' + tileData.tile.id + '(' + i + ' of ' + tileDataChange.length + ')',
              );
            }
          }
          lastEvent.value = i + 1;
        }

        // Render latest
        this.logger.debug('Now rendering latest images');
        for (let i = 0; i <= 3969; i++) {
          const image = tiles[i].image;
          let imageData = '';
          if (image) {
            imageData = decompressTileCode(tiles[i].image);
          }

          if (imageData.length == 768) {
            // this.logger.verbose('Saving latest image of tile: ' + i);
            await renderImage(imageData, 'cache/' + i + '/latest.png');
          }
        }
        await renderFullMap(previousTiles, 'cache/tilemap.png');

        const client = new S3SyncClient({
          region: 'us-east-1',
          credentials: {
            accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
          },
        });
        try {
          if (this.configService.get<string>('SYNC_TO_AWS') == 'true') {
            this.logger.verbose('Syncing to AWS!');
            const sync = await client.sync('cache', 's3://pixelmap.art', {
              del: false,
              sizeOnly: false,
              commandInput: {
                ContentType: (syncCommandInput) => mime.lookup(syncCommandInput.Key) || 'image/png',
              },
            });
            console.log(sync);
            this.logger.verbose('Sync to AWS complete!');
          } else {
            this.logger.verbose('Skipping sync, SYNC_TO_AWS is false.');
          }
        } catch (e) {
          this.logger.error('Error syncing to AWS: ' + e);
        }
        await this.currentState.persistAndFlush(lastEvent);
        this.currentlyReadingImages = false;
      } catch (e) {
        this.logger.error('Error rendering images: ' + e);
        this.currentlyReadingImages = false;
      }
    } else {
      this.logger.debug('Already rendering images, not starting again yet');
    }
  }
}
