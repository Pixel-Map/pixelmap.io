import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityRepository, QueryOrder } from '@mikro-orm/core';
import { InjectRepository } from '@mikro-orm/nestjs';
import { PurchaseHistory } from '../ingestor/entities/purchaseHistory.entity';
import { DiscordLastBlock } from './entities/discordLastBlock.entity';
import { DiscordClientProvider, Once } from 'discord-nestjs';
import { MessageEmbed, TextChannel } from 'discord.js';
import { format } from 'util';
import { lastValueFrom, timestamp } from 'rxjs';
import { ethers } from 'ethers';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config'; //import discord.js

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private currentlyReadingEventsIntoDiscord = false;
  private client;

  constructor(
    @InjectRepository(DiscordLastBlock)
    private discordLastBlock: EntityRepository<DiscordLastBlock>,
    @InjectRepository(PurchaseHistory)
    private purchaseHistory: EntityRepository<PurchaseHistory>,
    private readonly discordProvider: DiscordClientProvider,
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  @Once({ event: 'ready' })
  async onReady(): Promise<void> {
    this.client = await this.discordProvider.getClient();
    this.logger.log(`Logged in as ${this.client.user.tag}!`);
  }

  @Cron('1 * * * * *', {
    name: 'processDiscordEvents',
  })
  async eventsToDiscordNotifications() {
    if (!this.currentlyReadingEventsIntoDiscord) {
      this.currentlyReadingEventsIntoDiscord = true;
      let lastEvent = await this.discordLastBlock.findOne(1);
      if (lastEvent == undefined) {
        this.logger.log('First time processing discord events');
        lastEvent = new DiscordLastBlock({ id: 1, lastBlock: 0 });
        await this.discordLastBlock.persist(lastEvent);
      }

      const sales = await this.purchaseHistory.find({}, ['tile'], { id: QueryOrder.ASC });

      console.log(lastEvent.lastBlock);
      // console.log(sales);
      for (let i = lastEvent.lastBlock; i < sales.length; i++) {
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
        await (ChannelWantSend as TextChannel).send({ embeds: [message] });
        lastEvent.lastBlock = i + 1;
        await this.discordLastBlock.persist(lastEvent);
      }
      await this.discordLastBlock.flush();
      this.currentlyReadingEventsIntoDiscord = false;
    } else {
      this.logger.debug('Already ingesting, not starting again yet');
    }
  }
}
