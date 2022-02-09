import { Module } from '@nestjs/common';
import { IngestorService } from './ingestor.service';
import { DataHistory } from './entities/dataHistory.entity';
import { WrappingHistory } from './entities/wrappingHistory.entity';
import { PurchaseHistory } from './entities/purchaseHistory.entity';
import { TransferHistory } from './entities/transferHistory.entity';
import { Tile } from './entities/tile.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { CurrentState } from './entities/currentState.entity';
import { PixelMapTransaction } from './entities/pixelMapTransaction.entity';

@Module({
  imports: [
    IngestorModule,
    MikroOrmModule.forFeature([
      DataHistory,
      WrappingHistory,
      PurchaseHistory,
      TransferHistory,
      Tile,
      CurrentState,
      PixelMapTransaction,
    ]),
  ],

  providers: [IngestorService],
})
export class IngestorModule {}
