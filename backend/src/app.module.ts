import { Module } from "@nestjs/common";
import { CacheModule } from "@nestjs/cache-manager";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ScheduleModule } from "@nestjs/schedule";
import { IngestorModule } from "./ingestor/ingestor.module";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { DataHistory } from "./ingestor/entities/dataHistory.entity";
import { PurchaseHistory } from "./ingestor/entities/purchaseHistory.entity";
import { Tile } from "./ingestor/entities/tile.entity";
import { TransferHistory } from "./ingestor/entities/transferHistory.entity";
import { WrappingHistory } from "./ingestor/entities/wrappingHistory.entity";
import { NotificationsModule } from "./notifications/notifications.module";
import { RendererModule } from "./renderer/renderer.module";
import { CurrentState } from "./ingestor/entities/currentState.entity";
import { MetadataService } from "./metadata/metadata.service";
import { MetadataModule } from "./metadata/metadata.module";
import { OpenseaModule } from "./opensea/opensea.module";
import { SyncToS3Service } from "./sync-to-s3/sync-to-s3.service";
import { SyncToS3Module } from "./sync-to-s3/sync-to-s3.module";
import { PixelMapTransaction } from "./ingestor/entities/pixelMapTransaction.entity";
import { DiscordModule } from "@discord-nestjs/core";
import { GatewayIntentBits } from "discord.js";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";

@Module({
	imports: [
		CacheModule.register({ isGlobal: true, ttl: 1000000, max: 100000 }),
		ConfigModule.forRoot({ isGlobal: true }),
		ScheduleModule.forRoot(),
		MikroOrmModule.forFeature([Tile, DataHistory, PurchaseHistory]),
		MikroOrmModule.forRootAsync({
			useFactory: (configService: ConfigService) => ({
				metadataProvider: TsMorphMetadataProvider,
				entities: [
					CurrentState,
					DataHistory,
					PurchaseHistory,
					Tile,
					TransferHistory,
					WrappingHistory,
					PixelMapTransaction,
				],
				driver: PostgreSqlDriver,
				dbName: configService.get<string>("DATABASE_NAME"),
				host: configService.get<string>("DATABASE_HOST"),
				port: 5432,
				user: configService.get<string>("DATABASE_USERNAME"),
				password: configService.get<string>("DATABASE_PASSWORD"),
				driverOptions: {
					connection: { ssl: { rejectUnauthorized: false } },
				},
			}),
			inject: [ConfigService],
		}),
		DiscordModule.forRootAsync({
			imports: [ConfigModule],
			useFactory: async (configService: ConfigService) => ({
				token: configService.get<string>("DISCORD_TOKEN"),
				discordClientOptions: {
					intents: [
						GatewayIntentBits.Guilds,
						GatewayIntentBits.GuildMessages,
						GatewayIntentBits.GuildMessageReactions,
					], // Update this line
				},
				commandPrefix: "!",
				allowGuilds: ["745366351929016363"],
				denyGuilds: ["520622812742811698"],
				allowCommands: [
					{
						name: "some",
						channels: ["745366352386326572"],
						users: ["261863053329563648"],
						channelType: ["dm"],
					},
				],
				// and other discord options
			}),
			inject: [ConfigService],
		}),
		IngestorModule,
		NotificationsModule,
		RendererModule,
		MetadataModule,
		OpenseaModule,
		SyncToS3Module,
	],
	controllers: [AppController],
	providers: [AppService, MetadataService, SyncToS3Service],
})
export class AppModule {}
