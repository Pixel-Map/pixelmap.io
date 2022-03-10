import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { EntityRepository, MikroORM, QueryOrder } from '@mikro-orm/core';
import { InjectRepository, UseRequestContext } from '@mikro-orm/nestjs';
import { DiscordClientProvider, Once } from 'discord-nestjs';
import { MessageEmbed, TextChannel } from 'discord.js';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { CurrentState, StatesToTrack } from '../ingestor/entities/currentState.entity';
import { DataHistory } from '../ingestor/entities/dataHistory.entity'; //import discord.js

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private currentlyReadingEventsIntoDiscord = false;
  private client;

  constructor(
    @InjectRepository(CurrentState)
    private currentState: EntityRepository<CurrentState>,
    @InjectRepository(DataHistory)
    private dataHistory: EntityRepository<DataHistory>,
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

  @Cron('10 * * * * *', {
    name: 'processDiscordEvents',
  })
  @UseRequestContext()
  async eventsToDiscordNotifications() {
    if (!this.currentlyReadingEventsIntoDiscord) {
      this.currentlyReadingEventsIntoDiscord = true;
      const lastEvent = await this.currentState.findOne({
        state: StatesToTrack.NOTIFICATIONS_LAST_PROCESSED_TILE_CHANGE,
      });
      const dataHistory = await this.dataHistory.find({}, ['tile'], { id: QueryOrder.ASC });
      for (let i = lastEvent.value; i < dataHistory.length; i++) {
        const updatedTile = dataHistory[i];

        this.logger.log('processed ' + i + ' of ' + dataHistory.length);
        const ChannelWantSend = await this.client.channels.fetch('880262613664137270');
        let ownerName = undefined;
        try {
          ownerName = await lastValueFrom(
            this.httpService.get(`https://api.opensea.io/user/${updatedTile.tile.owner}?format=json`),
          );
        } catch {}
        const updatedBy = ownerName?.data?.username || updatedTile.tile.owner;
        const link = `https://pixelmap.art/${updatedTile.tile.id}/latest.png`;
        let sanitizedURL = updatedTile.tile.url.replace('http://', '');
        sanitizedURL = updatedTile.tile.url.replace('https://', '');
        sanitizedURL = sanitizedURL ? sanitizedURL : 'pixelmap.io';
        sanitizedURL = 'https://' + sanitizedURL;
        if (!isValidURL(sanitizedURL)) {
          sanitizedURL = 'https://pixelmap.io';
        }
        console.log(sanitizedURL);
        const message = new MessageEmbed()
          .setColor('#66ff82')
          .setTitle(`Tile #${updatedTile.tile.id} has been updated by ${updatedBy}!`)
          .setAuthor('PixelMap', 'https://pixelmap.io/assets/images/logo-color.png', 'https://pixelmap.io')
          .setDescription(getCompliment())
          .setFooter(`...And they've chosen to link it to: ${sanitizedURL}`)
          .setURL(sanitizedURL)
          .setThumbnail(link);
        if (updatedTile.tile.image.length != 0) {
          try {
            await (ChannelWantSend as TextChannel).send({ embeds: [message] });
          } catch {
            console.log('Failed to send notification because of bad URL, trying again!');
            message.setURL('https://pixelmap.io');
            await (ChannelWantSend as TextChannel).send({ embeds: [message] });
          }
        }
        lastEvent.value = i + 1;

        await this.currentState.persistAndFlush(lastEvent);
      }
      // await this.currentState.flush();
      this.currentlyReadingEventsIntoDiscord = false;
    } else {
      this.logger.debug('Already ingesting, not starting again yet');
    }
  }
}

function isValidURL(string) {
  const res = string.match(
    /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g,
  );
  return res !== null;
}

function getCompliment() {
  const compliments = [
    'Every artist was first an amateur. :catwhat:',
    'How beautiful!  Let them know what you think! :confetti_ball: :confetti_ball:',
    'Literally the most beautiful art ever to be created! :rainbowfrog:',
    'Not since the repainting of Ecce Homo has something so glorious been created! :ricodutch:',
    'The french toast of PixelMap tiles! :cooldoge:',
    'Hmm.  :head_bandage:',
    'Have no fear of perfection, you’ll never reach it... Well, this tile did. :cowboy:',
    'This tile makes Bob Ross look like a drill sargeant! :disguised_face:',
    'Pixel art is the stored honey of the human soul. :honey_pot: :honey_pot:',
    'A tile only a mother could love! :mrs_claus:',
    'When someone says a diamond in the rough, this tile is the rough! :gem:',
    'The 8th wonder of the world, is this gorgeous tile! :rocket: :rocket: :rocket:',
    'If a man devotes himself to art, much evil is avoided that happens otherwise if one is idle. :tada:',
    'Raw 768 character beauty.  Truly a work of art :tada: :tada: :tada:',
    ':squirrel: says -- "I love this!"',
    'After decades of work, this marvelous tile has been updated to represent the best of PixelMap! :rocket:',
    'Every artist dips his brush in his own soul, and paints his own nature into his pictures. :yoda:',
    'I WILL NEVER LOVE ANYTHING MORE THAN THIS! :tada: :rocket:',
    '“Painting is just another way of keeping a diary.” – Pablo Picasso',
    'Lovely :love: :love: :love:',
    'This must be what inspired the I FKN LOVE JPEGS tiles :love:',
    'What. In. The. :sweat_smile:',
  ];
  return compliments[Math.floor(Math.random() * compliments.length)];
}
