import { Module } from '@nestjs/common';
import { IngestorService } from './ingestor.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PixelMapEvent } from './entities/pixelMapEvent.entity';
import { DataHistory } from './entities/dataHistory.entity';
import { WrappingHistory } from './entities/wrappingHistory.entity';
import { PurchaseHistory } from './entities/purchaseHistory.entity';
import { TransferHistory } from './entities/transferHistory.entity';
import { Tile } from './entities/tile.entity';
import { DownloadedBlock } from './entities/downloadedBlock.entity';
import { IngestedEvent } from './entities/ingestedEvent.entity';

@Module({
  imports: [
    IngestorModule,
    TypeOrmModule.forFeature([
      DownloadedBlock,
      IngestedEvent,
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
