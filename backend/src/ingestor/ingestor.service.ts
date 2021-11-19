import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { ethers } from 'ethers';
import { Block } from './entities/block.entity';
import { Repository } from 'typeorm';
import { PixelMapEvent } from './entities/pixelMapEvent.entity';
import { Tile } from './entities/tile.entity';
import { DataHistory } from './entities/dataHistory.entity';
import { PurchaseHistory } from './entities/purchaseHistory.entity';
import { WrappingHistory } from './entities/wrappingHistory.entity';
import { TransferHistory } from './entities/transferHistory.entity';
import { DecodedPixelMapTransaction, decodeTransaction, TransactionType } from './utils/decodeTransaction';
import { initializeEthersJS } from './utils/initializeEthersJS';
import { exit } from '@nestjs/cli/actions';

const BLOCKS_TO_PROCESS_AT_TIME = 1;

@Injectable()
export class IngestorService {
  private readonly logger = new Logger(IngestorService.name);
  private lastDownloadedBlock;
  private currentlyRunningSync = true;
  private currentlyProcessingEvents = false;

  constructor(
    @InjectRepository(Block)
    private blocks: Repository<Block>,
    @InjectRepository(PixelMapEvent)
    private pixelMapEvent: Repository<PixelMapEvent>,
    @InjectRepository(Tile)
    private tile: Repository<Tile>,
    @InjectRepository(DataHistory)
    private dataHistory: Repository<DataHistory>,
    @InjectRepository(PurchaseHistory)
    private purchaseHistory: Repository<PurchaseHistory>,
    @InjectRepository(WrappingHistory)
    private wrappingHistory: Repository<WrappingHistory>,
    @InjectRepository(TransferHistory)
    private transferHistory: Repository<TransferHistory>,
  ) {}

  /**
   * initializeEthersJS initializes the PixelMap and PixelMapWrapper contracts
   */

  @Cron(new Date(Date.now() + 3000)) // Start 5 seconds after App startup
  async initialStartup() {
    let lastBlock = await this.blocks.findOne();
    if (lastBlock == undefined) {
      this.logger.log('Starting fresh, start of contract! (2641527)');
      lastBlock = await this.blocks.save({
        id: 1,
        currentDownloadedBlock: 2641527,
        currentIngestedBlock: 0,
      });
      for (let i = 0; i < 3970; i++) {
        this.logger.log('Initializing tile: ' + i);
        await this.tile.save({
          id: i,
          price: 2,
          wrapped: false,
          image: '',
          url: '',
          owner: '0x4f4b7e7edf5ec41235624ce207a6ef352aca7050', // Creator of Pixelmap
          dataHistory: [],
          wrappingHistory: [],
          purchaseHistory: [],
        });
      }
    }
    this.lastDownloadedBlock = lastBlock.currentDownloadedBlock;

    await this.syncBlocks();
    this.currentlyRunningSync = false;
    await this.resyncEveryMinute(); // Let's kick it off once so I don't have to wait a minute.
  }

  @Cron('45 * * * * *')
  async resyncEveryMinute() {
    if (this.currentlyRunningSync) {
      this.logger.log('Already syncing, skipping');
    } else {
      this.logger.debug('Syncing again, one moment.');
      this.currentlyRunningSync = true;
      await this.syncBlocks();
      // await this.ingestEvents();
      this.currentlyRunningSync = false;
    }
  }

  async syncBlocks() {
    const { provider, pixelMap, pixelMapWrapper } = initializeEthersJS();

    let endBlock = this.lastDownloadedBlock + BLOCKS_TO_PROCESS_AT_TIME;
    const mostRecentBlockNumber = await provider.getBlockNumber();
    this.logger.log('Last downloaded block: ' + this.lastDownloadedBlock);
    this.logger.log('End block: ' + endBlock);
    this.logger.log('Most recent block: ' + mostRecentBlockNumber);
    while (endBlock < mostRecentBlockNumber) {
      this.logger.debug('Processing blocks: ' + this.lastDownloadedBlock + ' - ' + endBlock);
      try {
        const events = await provider.send('eth_getLogs', [
          {
            address: [pixelMap.address, pixelMapWrapper.address],
            fromBlock: ethers.BigNumber.from(this.lastDownloadedBlock).toHexString(),
            toBlock: ethers.BigNumber.from(endBlock).toHexString(),
            topics: [
              [
                pixelMap.filters.TileUpdated().topics[0],
                pixelMapWrapper.filters.Transfer().topics[0],
                pixelMapWrapper.filters.Unwrapped().topics[0],
                pixelMapWrapper.filters.Wrapped().topics[0],
              ],
            ],
          },
        ]);
        await this.blocks.save(
          this.blocks.create({
            id: 1,
            currentDownloadedBlock: endBlock,
          }),
        );
        this.lastDownloadedBlock = endBlock;
        endBlock = this.lastDownloadedBlock + BLOCKS_TO_PROCESS_AT_TIME;
      } catch (error) {
        this.logger.warn('Error while ingesting.  Retrying');
        this.logger.warn(error);
      }
    }
    this.logger.debug('Finished syncing.  Will check again soon.');
  }

  // @Cron('45 * * * *')
  async processEvents(events) {
    if (!this.currentlyProcessingEvents) {
      this.currentlyProcessingEvents = true;
      const { provider, pixelMap, pixelMapWrapper } = initializeEthersJS();
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        const transaction = await provider.getTransaction(event.transactionHash);
        this.logger.log('Saving event at block: ' + transaction.blockNumber);
        if (await this.pixelMapEvent.findOne({ txHash: event.transactionHash, logIndex: event.logIndex })) {
          this.logger.warn('Already indexed this event, skipping!');
          return;
        } else {
          await this.pixelMapEvent.save({
            eventData: event,
            txHash: event.transactionHash,
            logIndex: event.logIndex,
            txData: transaction,
          });
        }
      }
      this.currentlyProcessingEvents = false;
    }
    if (this.currentlyProcessingEvents) {
      this.logger.debug('Already processing events, not starting again!');
    }
  }

  async ingestEvents() {
    const lastBlock = await this.blocks.findOne();
    const lastIngested = lastBlock.currentIngestedBlock;
    const events = await this.pixelMapEvent.find({
      skip: lastIngested,
      order: { id: 'ASC' },
    });
    for (let i = 0; i < events.length; i++) {
      const decodedEvent = await decodeTransaction(events[i], this.tile);
      await this.ingestEvent(decodedEvent);
      console.log(i + '/' + events.length);
      lastBlock.currentIngestedBlock = events[i].id;
      await this.blocks.save(lastBlock);
    }
  }

  async alreadyIndexed(repo: Repository<any>, txHash: string): Promise<boolean> {
    const existing = await repo.findOne({
      where: {
        tx: txHash,
      },
    });
    if (existing) {
      this.logger.warn('Already indexed this update, skipping!');
      return;
    }
    return true;
  }

  async ingestEvent(decodedEvent: DecodedPixelMapTransaction) {
    const { provider, pixelMap, pixelMapWrapper } = initializeEthersJS();
    // Skip event if it's a transfer to the wrapper, it's just the first step of wrapping.
    const tile: Tile = await this.tile.findOne({ id: decodedEvent.location });
    switch (decodedEvent.type) {
      case TransactionType.setTile:
        if (await this.alreadyIndexed(this.dataHistory, decodedEvent.txHash)) {
          this.logger.warn('Already indexed this setTile, skipping!');
          return;
        }
        this.logger.log('Tile updated at block: ' + decodedEvent.blockNumber + ' (' + decodedEvent.timestamp + ')');

        tile.image = decodedEvent.image ? decodedEvent.image : tile.image;
        tile.price = decodedEvent.price ? decodedEvent.price : tile.price;
        tile.url = decodedEvent.url ? decodedEvent.url : tile.url;
        tile.owner = decodedEvent.from ? decodedEvent.from : tile.owner;

        tile.dataHistory.push(
          new DataHistory({
            price: tile.price,
            url: tile.url,
            tx: decodedEvent.txHash,
            timeStamp: decodedEvent.timestamp,
            blockNumber: decodedEvent.blockNumber,
            image: tile.image,
            updatedBy: decodedEvent.from,
          }),
        );
        await this.tile.save(tile);
        break;
      case TransactionType.buyTile:
        if (await this.alreadyIndexed(this.purchaseHistory, decodedEvent.txHash)) {
          this.logger.warn('Already indexed this buyTile, skipping!');
          return;
        }
        this.logger.log('Tile bought at block: ' + decodedEvent.blockNumber + ' (' + decodedEvent.timestamp + ')');
        const purchaseHistory = new PurchaseHistory();
        if (decodedEvent.price <= 0) {
          throw 'Purchase cannot be 0 or less';
        }
        if (decodedEvent.to != tile.owner) {
          throw 'Incorrect owner??!';
        }
        tile.purchaseHistory.push(
          new PurchaseHistory({
            soldBy: tile.owner,
            purchasedBy: decodedEvent.from,
            tx: decodedEvent.txHash,
            timeStamp: decodedEvent.timestamp,
            blockNumber: decodedEvent.blockNumber,
          }),
        );
        tile.owner = decodedEvent.from; // Update AFTER updating purchasedBy!
        tile.price = 0; // Price is always set to zero following a sale!s
        await this.tile.save(tile);
        break;
      // case 'wrap':
      //   await this.processWrappedTile(event, decodedTransaction);
      //   break;
      default:
        this.logger.error('Failed to account for the following event:');
        exit();
    }
  }
  //
  // async processWrappedTile(event: PixelMapEvent, decodedTransaction) {
  //   this.logger.log('Tile wrapped at block: ' + event.txData.blockNumber);
  //   const tile: Tile = await this.getTile(decodedTransaction, event);
  //   if (tile.wrappingHistory.some((e) => e.tx === event.txHash)) {
  //     this.logger.warn('Already indexed this wrap, skipping!');
  //     return;
  //   }
  //   const timeStamp = await this.getTimestamp(event.txData.blockNumber);
  //   tile.wrapped = true;
  //   tile.owner = event.txData.from;
  //
  //   tile.wrappingHistory.push(
  //     new WrappingHistory({
  //       wrapped: true,
  //       tx: event.txHash,
  //       timeStamp: timeStamp,
  //       blockNumber: event.txData.blockNumber,
  //       updatedBy: event.txData.from,
  //     }),
  //   );
  //   await this.tile.save(tile);
  // }
  //
}
