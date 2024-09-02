import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@mikro-orm/nestjs";
import { CreateRequestContext } from "@mikro-orm/core";
import { Tile } from "../ingestor/entities/tile.entity";
// biome-ignore lint/style/useImportType: <explanation>
import { EntityRepository, MikroORM, QueryOrder } from "@mikro-orm/core";
import { Cron } from "@nestjs/schedule";
// biome-ignore lint/style/useImportType: <explanation>
import { HttpService } from "@nestjs/axios";
import { lastValueFrom } from "rxjs";
// biome-ignore lint/style/useImportType: <explanation>
import { ConfigService } from "@nestjs/config";
import BigNumber from "bignumber.js";
import { formatEther } from "ethers";

@Injectable()
export class OpenseaService {
	private readonly logger = new Logger(OpenseaService.name);
	private updatingOpenSeaPrices = false;

	constructor(
		@InjectRepository(Tile)
		private tileData: EntityRepository<Tile>,
		private httpService: HttpService,
		private readonly orm: MikroORM,
		private configService: ConfigService,
	) {}

	// Update OpenSea prices every 2 hours
	@Cron("0 */2 * * *")
	@CreateRequestContext()
	async updateOpenSeaPrices() {
		if (!this.updatingOpenSeaPrices) {
			this.updatingOpenSeaPrices = true;
			const openseaAPIKey = this.configService.get("OPENSEA_API_KEY");
			const tiles = await this.tileData.findAll({
				orderBy: { id: QueryOrder.ASC },
			});
			const limit = 15; //max 30 items for token_ids

			for (let id = 0; id <= 3969; id += 1) {
				try {
					if (tiles[id].wrapped) {
						this.logger.log(`Refreshing OpenSea metadata for tile: ${id}`);
						await lastValueFrom(
							this.httpService.post(
								`https://api.opensea.io/api/v2/chain/ethereum/contract/0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b/nfts/${id}/refresh`,
								{},
								{
									headers: {
										"X-API-KEY": openseaAPIKey,
									},
								},
							),
						);
						await sleep(1000); //throttle requests to prevent rate limiting with OS
					}
				} catch (e) {
					if (
						e.response?.data?.detail?.includes("NFT with identifier") &&
						e.response.data.detail.includes("not found for contract")
					) {
						this.logger.log(
							`Skipping, OpenSea doesn't have a record of this tile, likely unwrapped: ${id}`,
						);
					} else {
						this.logger.error(`METADATA REFRESH ERROR: ${e.message}`);
					}
				}
			}

			try {
				for (let id = 0; id <= 3969; id += limit) {
					try {
						this.logger.verbose(`Opensea update offset: ${id}`);
						const openseaURL = new URL(
							"https://api.opensea.io/wyvern/v1/orders",
						);
						openseaURL.searchParams.set(
							"asset_contract_address",
							"0x050dc61dFB867E0fE3Cf2948362b6c0F3fAF790b",
						);
						openseaURL.searchParams.set("side", "1");
						openseaURL.searchParams.set("include_bundled", "false");
						openseaURL.searchParams.set("include_invalid", "false");
						openseaURL.searchParams.set("order_by", "created_date");
						openseaURL.searchParams.set("order_direction", "asc");

						for (let i = id; i < id + limit; i++) {
							openseaURL.searchParams.append("token_ids", i.toString());
						}

						const response = await lastValueFrom(
							this.httpService.get(openseaURL.toString(), {
								headers: {
									"X-API-KEY": openseaAPIKey,
								},
							}),
						);

						const results = await response.data;
						if (results?.orders && results.orders.length > 0) {
							for (const order of results.orders) {
								const location = Number.parseInt(order.asset.token_id, 10);
								const weiPrice = new BigNumber(order.current_price);
								const price = formatEther(weiPrice.toFixed(0));
								tiles[location].openseaPrice = Number.parseFloat(price);
							}
						}
					} catch (e) {
						this.logger.error(e);
					}
					await this.tileData.getEntityManager().flush();
					await sleep(1000); //throttle requests to prevent rate limiting with OS
				}
			} catch (err) {
				this.logger.error(err);
			}

			this.updatingOpenSeaPrices = false;
		} else {
			this.logger.debug(
				"Already updating OpenSea prices, not starting again yet",
			);
		}
	}
}

async function sleep(millis) {
	return new Promise((resolve) => setTimeout(resolve, millis));
}
