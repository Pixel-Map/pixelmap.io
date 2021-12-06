import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { IngestorModule } from './ingestor/ingestor.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';
import { DataHistory } from './ingestor/entities/dataHistory.entity';
import { PixelMapEvent } from './ingestor/entities/pixelMapEvent.entity';
import { PurchaseHistory } from './ingestor/entities/purchaseHistory.entity';
import { Tile } from './ingestor/entities/tile.entity';
import { TransferHistory } from './ingestor/entities/transferHistory.entity';
import { WrappingHistory } from './ingestor/entities/wrappingHistory.entity';
import { NotificationsModule } from './notifications/notifications.module';
import { RendererModule } from './renderer/renderer.module';
import { CurrentState } from './ingestor/entities/currentState.entity';
import { MetadataService } from './metadata/metadata.service';
import { MetadataModule } from './metadata/metadata.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    MikroOrmModule.forFeature([Tile, DataHistory]),
    MikroOrmModule.forRoot({
      metadataProvider: TsMorphMetadataProvider,
      entities: [CurrentState, DataHistory, PixelMapEvent, PurchaseHistory, Tile, TransferHistory, WrappingHistory],
      type: 'postgresql',
      dbName: 'postgres',
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'password',
    }),
    IngestorModule,
    NotificationsModule,
    RendererModule,
    MetadataModule,
  ],
  controllers: [AppController],
  providers: [AppService, MetadataService],
})
export class AppModule {}
