import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { IngestorModule } from './ingestor/ingestor.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { DataHistory } from './ingestor/entities/dataHistory.entity';
import { DownloadedBlock } from './ingestor/entities/downloadedBlock.entity';
import { IngestedEvent } from './ingestor/entities/ingestedEvent.entity';
import { PixelMapEvent } from './ingestor/entities/pixelMapEvent.entity';
import { PurchaseHistory } from './ingestor/entities/purchaseHistory.entity';
import { Tile } from './ingestor/entities/tile.entity';
import { TransferHistory } from './ingestor/entities/transferHistory.entity';
import { WrappingHistory } from './ingestor/entities/wrappingHistory.entity';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    MikroOrmModule.forRoot({
      metadataProvider: TsMorphMetadataProvider,
      entities: [
        DataHistory,
        DownloadedBlock,
        IngestedEvent,
        PixelMapEvent,
        PurchaseHistory,
        Tile,
        TransferHistory,
        WrappingHistory,
      ],
      type: 'postgresql',
      dbName: 'postgres',
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'password',
    }),
    IngestorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
