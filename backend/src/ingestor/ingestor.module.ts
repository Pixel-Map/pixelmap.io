import { Module } from '@nestjs/common';
import { IngestorService } from './ingestor.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './entities/block.entity';
import { PixelMapEvent } from './entities/pixelMapEvent.entity';
import { DataHistory } from './entities/dataHistory.entity';
import { WrappingHistory } from './entities/wrappingHistory.entity';
import { PurchaseHistory } from './entities/purchaseHistory.entity';
import { TransferHistory } from './entities/transferHistory.entity';
import { Tile } from './entities/tile.entity';

@Module({
  imports: [
    IngestorModule,
    TypeOrmModule.forFeature([
      Block,
      PixelMapEvent,
      DataHistory,
      WrappingHistory,
      PurchaseHistory,
      TransferHistory,
      Tile,
    ]),
  ],
  providers: [IngestorService],
})
export class IngestorModule {}
