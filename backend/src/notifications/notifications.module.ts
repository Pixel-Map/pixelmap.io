import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';

import { DataHistory } from '../ingestor/entities/dataHistory.entity';
import { WrappingHistory } from '../ingestor/entities/wrappingHistory.entity';
import { PurchaseHistory } from '../ingestor/entities/purchaseHistory.entity';
import { TransferHistory } from '../ingestor/entities/transferHistory.entity';
import { DiscordModule } from '@discord-nestjs/core';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CurrentState } from '../ingestor/entities/currentState.entity';
import { PixelMapTransaction } from '../ingestor/entities/pixelMapTransaction.entity';
import { TransformPipe, ValidationPipe } from '@discord-nestjs/common';

@Module({
  providers: [NotificationsService],
  imports: [
    HttpModule,
    MikroOrmModule.forFeature([
      CurrentState,
      PixelMapTransaction,
      DataHistory,
      WrappingHistory,
      PurchaseHistory,
      TransferHistory,
    ]),
    DiscordModule.forFeature(),
  ],
})
export class NotificationsModule {}
