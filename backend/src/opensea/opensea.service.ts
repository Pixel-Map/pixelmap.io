import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository, UseRequestContext } from '@mikro-orm/nestjs';
import { Tile } from '../ingestor/entities/tile.entity';
import { EntityRepository, MikroORM, QueryOrder } from '@mikro-orm/core';
import { Cron } from '@nestjs/schedule';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import BigNumber from 'bignumber.js';
import { formatEther } from 'ethers/lib/utils';

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

  // Update OpenSea prices every 15 minutes
  @Cron('*/15 * * * *', {
    name: 'updateOpenSeaPrices',
  })
  @UseRequestContext()
  async updateOpenSeaPrices() {
    if (!this.updatingOpenSeaPrices) {
      this.updatingOpenSeaPrices = true;

      const tiles = await this.tileData.find({}, [], { id: QueryOrder.ASC });
      const limit = 15; //max 30 items for token_ids

      try {
        for (let id = 0; id <= 3969; id += limit) {
          this.logger.verbose(`Opensea update offset: ${id}`);
          const openseaURL = new URL('https://api.opensea.io/wyvern/v1/orders');
          openseaURL.searchParams.set('asset_contract_address', '0x050dc61dFB867E0fE3Cf2948362b6c0F3fAF790b');
          openseaURL.searchParams.set('side', '1');
          openseaURL.searchParams.set('include_bundled', 'false');
          openseaURL.searchParams.set('include_invalid', 'false');
          openseaURL.searchParams.set('order_by', 'created_date');
          openseaURL.searchParams.set('order_direction', 'asc');

          for (let i = id; i < id + limit; i++) {
            openseaURL.searchParams.append('token_ids', i.toString());
          }
          const openseaAPIKey = this.configService.get('OPENSEA_API_KEY');
          const response = await lastValueFrom(
            this.httpService.get(openseaURL.toString(), {
              headers: {
                'X-API-KEY': openseaAPIKey,
              },
            }),
          );

          const results = await response.data;

          if (results && results.orders && results.orders.length > 0) {
            results.orders.forEach((order) => {
              const location = parseInt(order.asset.token_id);
              const weiPrice = new BigNumber(order.current_price);
              const price = formatEther(weiPrice.toFixed(0));
              tiles[location].openseaPrice = parseFloat(price);
            });
          }
          await this.tileData.flush();
          await sleep(1000); //throttle requests to prevent rate limiting with OS
        }
      } catch (err) {
        console.log(err);
      }

      this.updatingOpenSeaPrices = false;
    } else {
      this.logger.debug('Already updating OpenSea prices, not starting again yet');
    }
  }
}

async function sleep(millis) {
  return new Promise((resolve) => setTimeout(resolve, millis));
}
