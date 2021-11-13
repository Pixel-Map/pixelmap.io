import { Module } from '@nestjs/common';
import { IngestorService } from './ingestor.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Block } from './entities/block.entity';
import { Tile } from './entities/tile.entity';
import { DataHistory } from './entities/dataHistory.entity';
import { PurchaseHistory } from './entities/purchaseHistory.entity';
import { WrappingHistory } from './entities/wrappingHistory.entity';
import { TransferHistory } from './entities/transferHistory.entity';

@Module({
  imports: [
    IngestorModule,
    TypeOrmModule.forFeature([Block, Tile, DataHistory, PurchaseHistory, WrappingHistory, TransferHistory]),
  ],
  providers: [IngestorService],
})
export class IngestorModule {}
