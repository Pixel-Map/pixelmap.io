import { Injectable, Logger } from "@nestjs/common";
// biome-ignore lint/style/useImportType: <explanation>
import { ConfigService } from "@nestjs/config";
import { Cron } from "@nestjs/schedule";

const fs = require("node:fs");
// biome-ignore lint/style/useImportType: <explanation>
import {
	CreateRequestContext,
	EntityRepository,
	QueryOrder,
} from "@mikro-orm/core";
import { decompressTileCode } from "../renderer/utils/decompressTileCode";
import { InjectRepository } from "@mikro-orm/nestjs";
import { Tile } from "../ingestor/entities/tile.entity";
import { DataHistory } from "../ingestor/entities/dataHistory.entity";
import { PurchaseHistory } from "../ingestor/entities/purchaseHistory.entity";
// biome-ignore lint/style/useImportType: <explanation>
import { MikroORM } from "@mikro-orm/core";
const S3SyncClient = require("s3-sync-client");
const mime = require("mime-types");

@Injectable()
export class SyncToS3Service {
	private readonly logger = new Logger(SyncToS3Service.name);
	private currentlySyncingToS3 = false;

	constructor(
		private configService: ConfigService,
		@InjectRepository(Tile)
		private tile: EntityRepository<Tile>,
		@InjectRepository(DataHistory)
		private dataHistory: EntityRepository<DataHistory>,
		@InjectRepository(PurchaseHistory)
		private purchaseHistory: EntityRepository<PurchaseHistory>,
		private readonly orm: MikroORM,
	) {}

	@Cron("1 * * * * *")
	@CreateRequestContext()
	async syncToS3() {
		if (this.currentlySyncingToS3) {
			this.logger.log("Already syncing to S3");
			return;
		}
		try {
			await this.regenerateAPIData();
			this.currentlySyncingToS3 = true;
			const client = new S3SyncClient({
				region: "us-east-1",
				credentials: {
					accessKeyId: this.configService.get("AWS_ACCESS_KEY_ID"),
					secretAccessKey: this.configService.get("AWS_SECRET_ACCESS_KEY"),
				},
			});
			if (this.configService.get<boolean>("SYNC_TO_AWS")) {
				this.logger.verbose("Syncing to AWS!");
				const sync = await client.sync("cache", "s3://pixelmap.art", {
					del: false,
					sizeOnly: false,
					commandInput: {
						ContentType: (syncCommandInput) =>
							mime.lookup(syncCommandInput.Key) || "image/png",
					},
				});
				this.logger.verbose("Sync to AWS complete!");
			} else {
				this.logger.verbose("Skipping sync, SYNC_TO_AWS is false.");
			}
		} catch (e) {
			this.logger.error(`Error syncing to AWS: ${e}`);
		}
		this.currentlySyncingToS3 = false;
	}

	async regenerateAPIData() {
		this.logger.verbose("Regenerating allImages data");
		const allImages = await this.allImages();
		await fs.writeFileSync(
			"cache/allimages.json",
			JSON.stringify(allImages, null, 2),
		);

		this.logger.verbose("Regenerating timecapsule data");
		const timeCapsule = await this.getFirstTilesWithImages();
		await fs.writeFileSync(
			"cache/timecapsule.json",
			JSON.stringify(timeCapsule, null, 2),
		);

		this.logger.verbose("Regenerating owners data");
		const owners = await this.getOwners();
		await fs.writeFileSync(
			"cache/owners.json",
			JSON.stringify(owners, null, 2),
		);
	}

	async allImages() {
		const historyEvents = await this.dataHistory.find(
			{},
			{
				populate: ["tile"],
				orderBy: { timeStamp: QueryOrder.ASC },
			},
		);
		const lastTileImage = new Map();

		// Initialize Map
		for (let i = 0; i <= 3970; i++) {
			lastTileImage.set(i, false);
		}

		let orderTileWasFound = 1;
		const allImages = [];
		for (let i = 0; i < historyEvents.length; i++) {
			const event = historyEvents[i];
			if (lastTileImage.get(event.tile.id) === event.image) {
			} else {
				if (this.isValidImage(event.image)) {
					lastTileImage.set(event.tile.id, event.image);
					allImages.push({
						tileId: event.tile.id,
						timeStamp: event.timeStamp,
						orderImageSetOnTile: orderTileWasFound,
						updatedBy: event.tile.ens ? event.tile.ens : event.updatedBy,
						image: event.image,
						blockNumber: event.blockNumber,
						date: event.timeStamp,
						image_url: `https://pixelmap.art/${event.tile.id}/${event.blockNumber}.png`,
						ens: event.tile.ens,
					});
					orderTileWasFound++;
				}
			}
		}
		return allImages;
	}

	async getFirstTilesWithImages() {
		const historyEvents = await this.dataHistory.find(
			{},
			{
				populate: ["tile"],
				orderBy: { timeStamp: QueryOrder.ASC },
			},
		);
		const tileAlreadyFound = new Map();
		let orderTileWasFound = 1;
		const timeCapsuleTiles = [];
		for (let i = 0; i < historyEvents.length; i++) {
			const event = historyEvents[i];
			if (this.isValidImage(event.image)) {
				if (tileAlreadyFound.has(event.tile.id)) {
				} else {
					tileAlreadyFound.set(event.tile.id, true);
					timeCapsuleTiles.push({
						tileId: event.tile.id,
						timeStamp: event.timeStamp,
						orderImageSetOnTile: orderTileWasFound,
						currentOwner: event.updatedBy,
						image: event.image,
					});
					orderTileWasFound++;
				}
			}
		}

		return timeCapsuleTiles;
	}

	isValidImage(imgStr: string): boolean {
		if (decompressTileCode(imgStr).trim().length === 768) {
			return true;
		}
		return false;
	}

	public findAll(): Promise<Array<Tile>> {
		return this.tile.findAll();
	}

	async getOgOwners() {
		const purchaseEvents = await this.purchaseHistory.findAll();
		const openSeaListDate = new Date("2021-8-27");

		const resultProductData = purchaseEvents.filter((a) => {
			const date = new Date(a.timeStamp);
			return date <= openSeaListDate;
		});
		const unique = [
			...new Set(resultProductData.map((tile) => tile.purchasedBy)),
		];
		console.log(unique.length);

		return unique;
	}

	async getOwners() {
		const tiles = await this.tile.findAll();
		const unique = [...new Set(tiles.map((tile) => tile.owner))];
		console.log(`Number of Owners: ${unique.length}`);
		return unique;
	}
}
