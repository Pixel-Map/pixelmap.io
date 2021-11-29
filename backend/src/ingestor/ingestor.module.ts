import { Module } from '@nestjs/common';
import { IngestorService } from './ingestor.service';
import { PixelMapEvent } from './entities/pixelMapEvent.entity';
import { DataHistory } from './entities/dataHistory.entity';
import { WrappingHistory } from './entities/wrappingHistory.entity';
import { PurchaseHistory } from './entities/purchaseHistory.entity';
import { TransferHistory } from './entities/transferHistory.entity';
import { Tile } from './entities/tile.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { ConfigService } from '@nestjs/config';
import { CurrentState } from './entities/currentState.entity';

@Module({
  imports: [
    IngestorModule,
    MikroOrmModule.forFeature([
      PixelMapEvent,
      DataHistory,
      WrappingHistory,
      PurchaseHistory,
      TransferHistory,
      Tile,
      CurrentState,
    ]),
    ConfigService,
  ],

  providers: [IngestorService],
})
export class IngestorModule {}
