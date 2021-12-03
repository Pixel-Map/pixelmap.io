import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository, UseRequestContext } from '@mikro-orm/nestjs';
import { CurrentState, StatesToTrack } from '../ingestor/entities/currentState.entity';
import { EntityRepository, MikroORM, QueryOrder } from '@mikro-orm/core';
import { Cron } from '@nestjs/schedule';
import { DataHistory } from '../ingestor/entities/dataHistory.entity';
import { renderImage } from './utils/renderImage';

@Injectable()
export class RendererService {
  private readonly logger = new Logger(RendererService.name);
  private currentlyReadingImages = false;

  constructor(
    @InjectRepository(CurrentState)
    private currentState: EntityRepository<CurrentState>,
    @InjectRepository(DataHistory)
    private dataHistory: EntityRepository<DataHistory>,
    private readonly orm: MikroORM,
  ) {}

  @Cron('1 * * * * *', {
    name: 'renderImages',
  })
  @UseRequestContext()
  async eventsToDiscordNotifications() {
    if (!this.currentlyReadingImages) {
      const previousTiles = {};
      this.currentlyReadingImages = true;
      const lastEvent = await this.currentState.findOne({
        state: StatesToTrack.RENDERER_LAST_PROCESSED_DATA_CHANGE,
      });
      const tileDataChange = await this.dataHistory.find({}, ['tile'], { id: QueryOrder.ASC });
      for (let i = lastEvent.value; i < tileDataChange.length; i++) {
        const tileData = tileDataChange[i];
        if (!previousTiles.hasOwnProperty(tileData.tile.id)) {
          console.log("Tile didn't exist, adding " + tileData.tile.id);
          previousTiles[tileData.tile.id] = '';
        }
        // if (previousTiles[tileData.tile.id] == tileData.tile.image) {
        //   this.logger.verbose("Image didn't change, not re-rendering");
        // } else {
        console.log('ohh new tile, nice!');
        previousTiles[tileData.tile.id] = tileData.tile.image;
        console.log('cache/' + tileData.tile.id + '/' + tileData.blockNumber + '.png');
        await renderImage(tileData.image, 'cache/' + tileData.tile.id + '/' + tileData.blockNumber + '.png');
        this.logger.log('rendered image ' + i + ' of ' + tileDataChange.length);
        lastEvent.value = i + 1;
        // }
        await this.currentState.persist(lastEvent);
      }
      this.currentlyReadingImages = false;
    } else {
      this.logger.debug('Already rendering images, not starting again yet');
    }
  }
  //   // upload to localstack - plugin does not support await need a bit time for IO
  //   const fileContent = fs.readFileSync("cache/" + i + ".png");
  //   const params = {
  //     Bucket: BUCKET_NAME,
  //     Key: "large_tiles/" + i + ".png", // File name you want to save as in S3
  //     Body: fileContent,
  //     ACL: "public-read",
  //     ContentType: "image/png",
  //   };
  //   await s3.upload(params, function () {
  //     console.log(
  //       `Tile image data uploaded successfully. ${data.Location} to ${BUCKET_NAME}`
  //     );
  //   });
  //
  //   tileMetaData.image =
  //     "https://s3.us-east-1.amazonaws.com/" +
  //     BUCKET_NAME +
  //     "/large_tiles/" +
  //     i +
  //     ".png";
  //   await fs.writeFileSync(
  //     "cache/" + i + ".json",
  //     JSON.stringify(tileMetaData)
  //   );
  // } else {
  //   // NO own image
  //   console.log("No image set, skipping!");
  //   tileMetaData.image =
  //     "https://s3.us-east-1.amazonaws.com/" +
  //     BUCKET_NAME +
  //     "/large_tiles/blank.png";
  //   await fs.writeFileSync(
  //     "cache/" + i + ".json",
  //     JSON.stringify(tileMetaData)
  //   );
  // }
}
