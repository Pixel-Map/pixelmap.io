import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityRepository, MikroORM, QueryOrder } from '@mikro-orm/core';
import { InjectRepository, UseRequestContext } from '@mikro-orm/nestjs';
import { PurchaseHistory } from '../ingestor/entities/purchaseHistory.entity';
import { DiscordClientProvider, Once } from 'discord-nestjs';
import { MessageEmbed } from 'discord.js';
import { lastValueFrom } from 'rxjs';
import { ethers } from 'ethers';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CurrentState, StatesToTrack } from '../ingestor/entities/currentState.entity'; //import discord.js

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private currentlyReadingEventsIntoDiscord = false;
  private client;

  constructor(
    @InjectRepository(CurrentState)
    private currentState: EntityRepository<CurrentState>,
    @InjectRepository(PurchaseHistory)
    private purchaseHistory: EntityRepository<PurchaseHistory>,
    private readonly discordProvider: DiscordClientProvider,
    private httpService: HttpService,
    private configService: ConfigService,
    private readonly orm: MikroORM,
  ) {}

  @Once({ event: 'ready' })
  async onReady(): Promise<void> {
    this.client = await this.discordProvider.getClient();
    this.logger.log(`Logged in as ${this.client.user.tag}!`);
  }

  @Cron('1 * * * * *', {
    name: 'processDiscordEvents',
  })
  @UseRequestContext()
  async eventsToDiscordNotifications() {
    if (!this.currentlyReadingEventsIntoDiscord) {
      this.currentlyReadingEventsIntoDiscord = true;
      const lastEvent = await this.currentState.findOne({
        state: StatesToTrack.NOTIFICATIONS_LAST_PROCESSED_PURCHASE_ID,
      });
      const sales = await this.purchaseHistory.find({}, ['tile'], { id: QueryOrder.ASC });
      for (let i = lastEvent.value; i < sales.length; i++) {
        console.log(sales[i]);
        const sale = sales[i];
        this.logger.log('processed ' + i + ' of ' + sales.length);
        const ChannelWantSend = await this.client.channels.fetch('880480166793597048');
        const etherscanAPIKey = this.configService.get('ETHERSCAN_API_KEY');
        const provider = new ethers.providers.EtherscanProvider('mainnet', etherscanAPIKey);
        const usdToEthPrice = await provider.getEtherPrice();
        const formatter = new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
        });

        let buyerName = undefined;
        let sellerName = undefined;
        try {
          buyerName = await lastValueFrom(
            this.httpService.get(`https://api.opensea.io/user/${sale.purchasedBy}?format=json`),
          );
        } catch {}
        const buyer = buyerName?.data?.username || sale.purchasedBy;

        try {
          sellerName = await lastValueFrom(
            this.httpService.get(`https://api.opensea.io/user/${sale.soldBy}?format=json`),
          );
        } catch {}
        const seller = sellerName?.data?.username || sale.soldBy;

        const usd = formatter.format(sale.price * usdToEthPrice);
        const link = `https://s3.us-east-1.amazonaws.com/pixelmap.io/large_tiles/${sale.tile.id}.png`;
        console.log(link);
        const message = new MessageEmbed()
          .setColor('#66ff82')
          .setTitle(`Tile #${sale.tile.id} has been sold`)
          .setAuthor('PixelMap', 'https://pixelmap.io/assets/images/logo-color.png', 'https://pixelmap.io')
          .setDescription(
            `Buyer: **${buyer.substring(0, 16)}**\nSeller: **${seller.substring(
              0,
              16,
            )}**\n----------------------------`,
          )
          .addFields(
            { name: 'ETH', value: `${sale.price}Ξ`, inline: true },
            { name: 'USD', value: `${usd}`, inline: true },
          )
          .setURL(`https://opensea.io/assets/0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b/${sale.tile.id}`)
          .setFooter('Nice Purchase • ' + sale.timeStamp.toLocaleString('en-US'))
          .setThumbnail(link);
        // await (ChannelWantSend as TextChannel).send({ embeds: [message] });
        lastEvent.value = i + 1;
        await this.currentState.persist(lastEvent);
      }
      await this.currentState.flush();
      this.currentlyReadingEventsIntoDiscord = false;
    } else {
      this.logger.debug('Already ingesting, not starting again yet');
    }
  }
}
