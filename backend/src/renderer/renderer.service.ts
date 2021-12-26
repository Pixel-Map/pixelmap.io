import { CACHE_MANAGER, Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { InjectRepository, UseRequestContext } from '@mikro-orm/nestjs';
import { CurrentState, StatesToTrack } from '../ingestor/entities/currentState.entity';
import { EntityRepository, MikroORM, QueryOrder } from '@mikro-orm/core';
import { Cron } from '@nestjs/schedule';
import { DataHistory } from '../ingestor/entities/dataHistory.entity';
import { renderImage } from './utils/renderImage';
import { renderFullMap } from './utils/renderFullMap';
import { decompressTileCode } from './utils/decompressTileCode';
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
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
            const imageData = decompressTileCode(tileData.image.trim());

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
            const lastRender = await this.cacheManager.get('image-' + String(tiles[i].id));
            if (lastRender == imageData) {
              // this.logger.verbose('Already rendered previously, skipping!');
            } else {
              this.logger.verbose('Saving latest image of tile: ' + i);
              await renderImage(imageData, 'cache/' + i + '/latest.png');
              // Cache it so we don't re-render needlessly!
              await this.cacheManager.set('image-' + String(tiles[i].id), imageData);
            }
          }
        }
        await renderFullMap(previousTiles, 'cache/tilemap.png');

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
