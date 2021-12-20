import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
const S3SyncClient = require('s3-sync-client');
const mime = require('mime-types');

@Injectable()
export class SyncToS3Service {
  private readonly logger = new Logger(SyncToS3Service.name);
  private currentlySyncingToS3 = false;
  constructor(private configService: ConfigService) {}

  @Cron('1 * * * * *')
  async syncToS3() {
    if (this.currentlySyncingToS3) {
      this.logger.log('Already syncing to S3');
      return;
    } else {
      try {
        this.currentlySyncingToS3 = true;
        const client = new S3SyncClient({
          region: 'us-east-1',
          credentials: {
            accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
          },
        });
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
      this.currentlySyncingToS3 = false;
    }
  }
}
