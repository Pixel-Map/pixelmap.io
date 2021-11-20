import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { ethers } from 'ethers';
import { DownloadedBlock } from './entities/downloadedBlock.entity';
import { IngestedEvent } from './entities/ingestedEvent.entity';
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

const BLOCKS_TO_PROCESS_AT_TIME = 1000;

@Injectable()
export class IngestorService {
  private readonly logger = new Logger(IngestorService.name);
  private lastDownloadedBlock;
  private lastIngestedEvent;
  private currentlyRunningSync = true;
  private currentlyIngestingEvents = false;

  constructor(
    @InjectRepository(DownloadedBlock)
    private downloadedBlocks: Repository<DownloadedBlock>,
    @InjectRepository(IngestedEvent)
    private ingestedEvents: Repository<IngestedEvent>,
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
    let lastBlock = await this.downloadedBlocks.findOne();
    if (lastBlock == undefined) {
      this.logger.log('Starting fresh, start of contract! (2641527)');
      lastBlock = await this.downloadedBlocks.save({
        id: 1,
        lastDownloadedBlock: 2641527,
      });
    }
    this.lastDownloadedBlock = lastBlock.lastDownloadedBlock;

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
      this.currentlyRunningSync = false;
    }
  }

  async syncBlocks() {
    const { provider, pixelMap, pixelMapWrapper } = initializeEthersJS();

    let endBlock = this.lastDownloadedBlock + BLOCKS_TO_PROCESS_AT_TIME;
    if (endBlock > 3974343 && endBlock < 13062712) {
      this.logger.log('Teleporting past the land of nothingness!');
      endBlock = 13062713;
    }

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
        await this.processEvents(events);
        await this.downloadedBlocks.save(
          this.downloadedBlocks.create({
            id: 1,
            lastDownloadedBlock: endBlock,
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

  async processEvents(events) {
    const { provider, pixelMap, pixelMapWrapper } = initializeEthersJS();
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const transaction = await provider.getTransaction(event.transactionHash);
      this.logger.log('Saving event at block: ' + transaction.blockNumber);
      if (await this.pixelMapEvent.findOne({ txHash: event.transactionHash, logIndex: parseInt(event.logIndex) })) {
        this.logger.warn('Already indexed this event, skipping!');
        return;
      } else {
        await this.pixelMapEvent.save({
          eventData: event,
          txHash: event.transactionHash,
          logIndex: parseInt(event.logIndex),
          txData: transaction,
          block: transaction.blockNumber,
        });
      }
    }
  }

  @Cron('1 * * * * *')
  async ingestEvents() {
    if (!this.currentlyIngestingEvents) {
      this.currentlyIngestingEvents = true;
      let lastEvent = await this.ingestedEvents.findOne();
      if (lastEvent == undefined) {
        this.logger.log('Starting fresh, start of events! (0)');
        lastEvent = await this.ingestedEvents.save({
          id: 1,
          lastIngestedEvent: 0,
        });
      }
      this.lastIngestedEvent = lastEvent.lastIngestedEvent;

      if (this.lastIngestedEvent == 0) {
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
      const events = await this.pixelMapEvent.find({
        skip: this.lastIngestedEvent,
        order: { block: 'ASC' },
      });
      for (let i = 0; i < events.length; i++) {
        const decodedEvent = await decodeTransaction(events[i], this.tile);
        await this.ingestEvent(decodedEvent);
        const percent = (100 * (i + 1)) / events.length;
        this.logger.verbose(i + 1 + '/' + events.length + ' events processed (' + percent + '% complete)');
        lastEvent.lastIngestedEvent = events[i].id;
        await this.ingestedEvents.save(lastEvent);
      }
      this.currentlyIngestingEvents = false;
    } else {
      this.logger.debug('Already ingesting, not starting again yet');
    }
  }

  async alreadyIndexed(repo: Repository<any>, txHash: string, logIndex: number): Promise<boolean> {
    const existing = await repo.findOne({
      where: {
        tx: txHash,
        logIndex: logIndex,
      },
    });
    if (existing) {
      this.logger.warn('Already indexed this update, skipping!');
      return true;
    }
    return false;
  }

  async alreadyIndexedWrap(repo: Repository<any>, txHash: string): Promise<boolean> {
    const existing = await repo.findOne({
      where: {
        tx: txHash,
      },
    });
    if (existing) {
      this.logger.warn('Already indexed this update, skipping!');
      return true;
    }
    return false;
  }

  async ingestEvent(decodedEvent: DecodedPixelMapTransaction) {
    // Skip event if it's a transfer to the wrapper, it's just the first step of wrapping.
    const tile: Tile = await this.tile.findOne({ id: decodedEvent.location });

    switch (decodedEvent.type) {
      case TransactionType.setTile:
        if (await this.alreadyIndexed(this.dataHistory, decodedEvent.txHash, decodedEvent.logIndex)) {
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
            logIndex: decodedEvent.logIndex,
          }),
        );
        await this.tile.save(tile);
        break;
      case TransactionType.buyTile:
        if (await this.alreadyIndexed(this.purchaseHistory, decodedEvent.txHash, decodedEvent.logIndex)) {
          this.logger.warn('Already indexed this buyTile, skipping!');
          return;
        }
        this.logger.log(
          'Tile ' +
            decodedEvent.location +
            ' bought at block: ' +
            decodedEvent.blockNumber +
            ' (' +
            decodedEvent.timestamp +
            ')',
        );
        if (decodedEvent.price <= 0) {
          throw 'Purchase cannot be 0 or less';
        }
        if (decodedEvent.to.toLowerCase() != tile.owner.toLowerCase()) {
          console.log(decodedEvent);
          console.log(tile.owner);
          this.logger.error('Incorrect owner??!');
          exit();
        }
        tile.purchaseHistory.push(
          new PurchaseHistory({
            soldBy: tile.owner,
            purchasedBy: decodedEvent.from,
            price: decodedEvent.price ? decodedEvent.price : tile.price,
            tx: decodedEvent.txHash,
            timeStamp: decodedEvent.timestamp,
            blockNumber: decodedEvent.blockNumber,
            logIndex: decodedEvent.logIndex,
          }),
        );
        tile.owner = decodedEvent.from; // Update AFTER updating purchasedBy!
        tile.price = 0; // Price is always set to zero following a sale!s
        await this.tile.save(tile);
        break;
      case TransactionType.wrap:
        if (await this.alreadyIndexedWrap(this.wrappingHistory, decodedEvent.txHash)) {
          this.logger.warn('Already indexed this wrap, skipping!');
          return;
        }
        this.logger.log('Tile wrapped at block: ' + decodedEvent.blockNumber + ' (' + decodedEvent.timestamp + ')');
        tile.wrapped = true;
        tile.owner = decodedEvent.from;

        tile.wrappingHistory.push(
          new WrappingHistory({
            wrapped: true,
            tx: decodedEvent.txHash,
            timeStamp: decodedEvent.timestamp,
            blockNumber: decodedEvent.blockNumber,
            updatedBy: decodedEvent.from,
            logIndex: decodedEvent.logIndex,
          }),
        );
        await this.tile.save(tile);
        break;
      case TransactionType.unwrap:
        if (await this.alreadyIndexedWrap(this.wrappingHistory, decodedEvent.txHash)) {
          this.logger.warn('Already indexed this unwrap, skipping!');
          return;
        }
        this.logger.log('Tile unwrapped at block: ' + decodedEvent.blockNumber + ' (' + decodedEvent.timestamp + ')');
        tile.wrapped = false;
        tile.owner = decodedEvent.from;

        tile.wrappingHistory.push(
          new WrappingHistory({
            wrapped: false,
            tx: decodedEvent.txHash,
            timeStamp: decodedEvent.timestamp,
            blockNumber: decodedEvent.blockNumber,
            updatedBy: decodedEvent.from,
            logIndex: decodedEvent.logIndex,
          }),
        );
        await this.tile.save(tile);
        break;
      case TransactionType.transfer:
        if (await this.alreadyIndexed(this.transferHistory, decodedEvent.txHash, decodedEvent.logIndex)) {
          this.logger.warn('Already indexed this transfer, skipping!');
          return;
        }
        this.logger.log('Tile transferred at block: ' + decodedEvent.blockNumber + ' (' + decodedEvent.timestamp + ')');
        tile.owner = decodedEvent.from;

        tile.transferHistory.push(
          new TransferHistory({
            tx: decodedEvent.txHash,
            timeStamp: decodedEvent.timestamp,
            blockNumber: decodedEvent.blockNumber,
            transferredFrom: decodedEvent.to,
            transferredTo: decodedEvent.from,
            logIndex: decodedEvent.logIndex,
          }),
        );
        await this.tile.save(tile);
        break;
      default:
        this.logger.error('Failed to account for the following event:');
        console.log(decodedEvent);
        exit();
    }
  }
}
