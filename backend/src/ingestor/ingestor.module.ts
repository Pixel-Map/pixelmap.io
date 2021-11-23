import { Module } from '@nestjs/common';
import { IngestorService } from './ingestor.service';
import { PixelMapEvent } from './entities/pixelMapEvent.entity';
import { DataHistory } from './entities/dataHistory.entity';
import { WrappingHistory } from './entities/wrappingHistory.entity';
import { PurchaseHistory } from './entities/purchaseHistory.entity';
import { TransferHistory } from './entities/transferHistory.entity';
import { Tile } from './entities/tile.entity';
import { DownloadedBlock } from './entities/downloadedBlock.entity';
import { IngestedEvent } from './entities/ingestedEvent.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
  imports: [
    IngestorModule,
    MikroOrmModule.forFeature([
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
