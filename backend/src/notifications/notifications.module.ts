import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { DownloadedBlock } from '../ingestor/entities/downloadedBlock.entity';
import { IngestedEvent } from '../ingestor/entities/ingestedEvent.entity';
import { PixelMapEvent } from '../ingestor/entities/pixelMapEvent.entity';
import { DataHistory } from '../ingestor/entities/dataHistory.entity';
import { WrappingHistory } from '../ingestor/entities/wrappingHistory.entity';
import { PurchaseHistory } from '../ingestor/entities/purchaseHistory.entity';
import { TransferHistory } from '../ingestor/entities/transferHistory.entity';
import { Tile } from '../ingestor/entities/tile.entity';
import { DiscordLastBlock } from './entities/discordLastBlock.entity';
import { DiscordModule, TransformPipe, ValidationPipe } from 'discord-nestjs';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  providers: [NotificationsService],
  imports: [
    HttpModule,
    MikroOrmModule.forFeature([
      DownloadedBlock,
      IngestedEvent,
      PixelMapEvent,
      DataHistory,
      WrappingHistory,
      PurchaseHistory,
      TransferHistory,
      DiscordLastBlock,
    ]),
    ConfigService,
    DiscordModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        token: configService.get<string>('DISCORD_TOKEN'),
        intents: ['GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS'],
        commandPrefix: '!',
        allowGuilds: ['745366351929016363'],
        denyGuilds: ['520622812742811698'],
        allowCommands: [
          {
            name: 'some',
            channels: ['745366352386326572'],
            users: ['261863053329563648'],
            channelType: ['dm'],
          },
        ],
        usePipes: [TransformPipe, ValidationPipe],
        // and other discord options
      }),
    }),
  ],
})
export class NotificationsModule {}
