import { Module } from '@nestjs/common';
import { DataHistory } from '../ingestor/entities/dataHistory.entity';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { Tile } from '../ingestor/entities/tile.entity';
import { PurchaseHistory } from '../ingestor/entities/purchaseHistory.entity';

@Module({ imports: [MikroOrmModule.forFeature([DataHistory, PurchaseHistory, Tile])] })
export class SyncToS3Module {}
