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

  @Cron('0 */30 * * * *')
  @UseRequestContext()
  async renderImages() {
    if (!this.currentlyReadingImages) {
      try {
        this.logger.log('Starting to update images again...');
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

          previousTiles[tileData.tile.id] = tileData.image;
          const imageData = decompressTileCode(tileData.image.trim());

          if (imageData.length == 768) {
            this.logger.verbose('Saving image of tile: ' + tileData.tile.id + ' at block: ' + tileData.blockNumber);
            await renderImage(imageData, 512, 512, 'cache/' + tileData.tile.id + '/' + tileData.blockNumber + '.png');
            await renderFullMap(previousTiles, 'cache/fullmap/' + tileData.blockNumber + '.png');
            this.logger.verbose(
              'Rendered image for tile: ' + tileData.tile.id + '(' + i + ' of ' + tileDataChange.length + ')',
            );
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
          if (imageData.length != 768) {
            imageData =
              '000200310310310310310310310310310310310310310000200853b75b76b76b76b76b76b76b76b76b76b76b86a75311310b' +
              '75dbadbbdbbdbbdbbdbbdbbdbbdbbdbbdbbdbbca8331310b76dbbdbbdaadbbdbbdaadaadbbdbbdaadabdbbca8331310b76db' +
              'bdaadaadbbdbbdaadaadbbdbbdaadaadbbca8331310b76dbbdbbdbbb86a75ca8daab76b76daadaadbbca8331310b76dbbdbb' +
              'dbba75952b86b86953a65daadaadbbca8331310b76dbbdaadaaca8b86954954b75ca8daadaadbbca8331310b76dbbdaadaad' +
              'aab86954953b75da9daadaadbbca8331310b76dbbdbbdbbb76953b75b75a54b76daadaadbbca8331310b76dbbdbbdbbb76a6' +
              '5ca8da9b76a65daadaadbbca8331310b76dbbdaadaadaadaadaadaadaadaadaadaadbbca8331310b76dbbdabdaadaadaadaa' +
              'daadaadaadaadaadbbca8332310b86dbbdbbdbbdbbdbbdbbdbbdbbdbbdbbdbbebbda9432310a75ca8ca8ca8ca8ca8ca8ca8c' +
              'a8ca8ca8ca8ca8b86321000311331331331331331331331331331331331331320000';
          }

          if (imageData.length === 768) {
            const lastRender = await this.cacheManager.get(`image-${String(tiles[i].id)}`);
            if (lastRender === imageData) {
              // this.logger.verbose('Already rendered previously, skipping!');
            } else {
              this.logger.verbose(`Saving latest image of tile: ${i}`);
              await renderImage(imageData, 512, 512, `cache/${i}/latest.png`);
              await renderImage(imageData, 2048, 2048, `cache/${i}/large.png`);
              // Cache it so we don't re-render needlessly!
              await this.cacheManager.set(`image-${String(tiles[i].id)}`, imageData);
            }
          } else {
            console.log(imageData);
            throw "Somehow imagedata wasn't 768 bytes long!";
          }
        }
        await renderFullMap(previousTiles, 'cache/tilemap.png');

        await this.currentState.persistAndFlush(lastEvent);
        this.currentlyReadingImages = false;
      } catch (e) {
        this.logger.error(`Error rendering images: ${e}`);
        this.currentlyReadingImages = false;
      }
    } else {
      this.logger.debug('Already rendering images, not starting again yet');
    }
  }
}
