import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ethers } from 'ethers';
import { PixelMapEvent } from './entities/pixelMapEvent.entity';
import { Tile } from './entities/tile.entity';
import { DataHistory } from './entities/dataHistory.entity';
import { PurchaseHistory } from './entities/purchaseHistory.entity';
import { WrappingHistory } from './entities/wrappingHistory.entity';
import { TransferHistory } from './entities/transferHistory.entity';
import { DecodedPixelMapTransaction, decodeTransaction, TransactionType } from './utils/decodeTransaction';
import { initializeEthersJS } from './utils/initializeEthersJS';
import { exit } from '@nestjs/cli/actions';
import { EntityRepository, MikroORM, QueryOrder } from '@mikro-orm/core';
import { InjectRepository, UseRequestContext } from '@mikro-orm/nestjs';
import { CurrentState, StatesToTrack } from './entities/currentState.entity';

const BLOCKS_TO_PROCESS_AT_TIME = 1000;

@Injectable()
export class IngestorService {
  private readonly logger = new Logger(IngestorService.name);
  private currentlyRunningSync = true;
  private currentlyIngestingEvents = false;

  constructor(
    @InjectRepository(CurrentState)
    private currentState: EntityRepository<CurrentState>,
    @InjectRepository(PixelMapEvent)
    private pixelMapEvent: EntityRepository<PixelMapEvent>,
    @InjectRepository(Tile)
    private tile: EntityRepository<Tile>,
    @InjectRepository(DataHistory)
    private dataHistory: EntityRepository<DataHistory>,
    @InjectRepository(PurchaseHistory)
    private purchaseHistory: EntityRepository<PurchaseHistory>,
    @InjectRepository(WrappingHistory)
    private wrappingHistory: EntityRepository<WrappingHistory>,
    @InjectRepository(TransferHistory)
    private transferHistory: EntityRepository<TransferHistory>,
    private readonly orm: MikroORM,
  ) {}

  async onApplicationBootstrap() {
    this.currentlyIngestingEvents = true;

    // Initialize Data if Empty
    if ((await this.currentState.findOne({ state: StatesToTrack.INGESTION_LAST_DOWNLOADED_BLOCK })) == undefined) {
      this.logger.log('Starting fresh, start of events! (0)');
      await this.currentState.persistAndFlush([
        new CurrentState({
          state: StatesToTrack.INGESTION_LAST_DOWNLOADED_BLOCK,
          value: 2641527, // This is the block that PixelMap was created
        }),
        new CurrentState({
          state: StatesToTrack.INGESTION_LAST_PROCESSED_PIXEL_MAP_EVENT,
          value: 0,
        }),
        new CurrentState({
          state: StatesToTrack.NOTIFICATIONS_LAST_PROCESSED_PURCHASE_ID,
          value: 0,
        }),
      ]);

      for (let i = 0; i < 3970; i++) {
        this.logger.log('Initializing tile: ' + i);
        const tile = await this.tile.create({
          id: i,
          price: 2,
          wrapped: false,
          image: '',
          url: '',
          owner: '0x4f4b7e7edf5ec41235624ce207a6ef352aca7050', // Creator of Pixelmap
        });
        await this.tile.persist(tile);
      }
      await this.tile.flush();
    }
    this.currentlyIngestingEvents = false;
  }
  /**
   * initializeEthersJS initializes the PixelMap and PixelMapWrapper contracts
   */

  @Cron(new Date(Date.now() + 10000)) // Start 5 seconds after App startup
  async initialStartup() {
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
    const lastBlock = await this.currentState.findOne({ state: StatesToTrack.INGESTION_LAST_DOWNLOADED_BLOCK });
    let lastDownloadedBlock = lastBlock.value;

    let endBlock = lastDownloadedBlock + BLOCKS_TO_PROCESS_AT_TIME;

    const mostRecentBlockNumber = await provider.getBlockNumber();
    this.logger.log('Currently on block: ' + lastDownloadedBlock);
    this.logger.log('End block: ' + endBlock);
    this.logger.log('Most recent block on blockchain: ' + mostRecentBlockNumber);
    while (endBlock < mostRecentBlockNumber) {
      this.logger.debug('Processing blocks: ' + lastDownloadedBlock + ' - ' + endBlock);
      try {
        const events = await provider.send('eth_getLogs', [
          {
            address: [pixelMap.address, pixelMapWrapper.address],
            fromBlock: ethers.BigNumber.from(lastDownloadedBlock).toHexString(),
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
        lastBlock.value = endBlock;
        await this.currentState.persistAndFlush(lastBlock);
        lastDownloadedBlock = endBlock + 1;
        endBlock = lastDownloadedBlock + BLOCKS_TO_PROCESS_AT_TIME;

        // Secret Teleportation past nothingness
        if (lastDownloadedBlock > 3974343 && lastDownloadedBlock < 13062712) {
          this.logger.log('Teleporting past the land of nothingness!');
          lastDownloadedBlock = 13062713;
          endBlock = lastDownloadedBlock + BLOCKS_TO_PROCESS_AT_TIME;
        }
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
      if (await this.pixelMapEvent.findOne({ txHash: event.transactionHash, logIndex: parseInt(event.logIndex) })) {
        this.logger.warn('Already indexed this event, skipping!');
        return;
      } else {
        this.logger.log('Saving event at block: ' + transaction.blockNumber);
        const pixelMapEvent = new PixelMapEvent({
          eventData: event,
          txHash: event.transactionHash,
          logIndex: parseInt(event.logIndex),
          txData: transaction,
          block: transaction.blockNumber,
        });
        await this.pixelMapEvent.persistAndFlush(pixelMapEvent);
      }
    }
  }

  @Cron('1 * * * * *', {
    name: 'ingestEvents',
  })
  @UseRequestContext()
  async ingestEvents() {
    if (!this.currentlyIngestingEvents) {
      this.currentlyIngestingEvents = true;
      const lastEvent = await this.currentState.findOne({
        state: StatesToTrack.INGESTION_LAST_PROCESSED_PIXEL_MAP_EVENT,
      });

      const events = await this.pixelMapEvent.find({}, { orderBy: { id: QueryOrder.ASC } });

      for (let i = lastEvent.value; i < events.length; i++) {
        const decodedEvent = await decodeTransaction(events[i], this.tile);
        await this.ingestEvent(decodedEvent);
        const percent = Math.round((100 * (i + 1)) / events.length);
        this.logger.verbose(
          i + 1 + '/' + events.length + ' events processed (' + percent + '% complete) - ' + events[i].id,
        );
        lastEvent.value = i;
        await this.currentState.persistAndFlush(lastEvent);
      }
      this.currentlyIngestingEvents = false;
    } else {
      this.logger.debug('Already ingesting, not starting again yet');
    }
  }

  async alreadyIndexed(repo: EntityRepository<any>, txHash: string, logIndex: number): Promise<boolean> {
    const existing = await repo.findOne({
      tx: txHash,
      logIndex: logIndex,
    });
    if (existing) {
      this.logger.warn('Already indexed this update, skipping!');
      return true;
    }
    return false;
  }

  async alreadyIndexedWrap(repo: EntityRepository<any>, txHash: string): Promise<boolean> {
    const existing = await repo.findOne({
      tx: txHash,
    });
    if (existing) {
      this.logger.warn('Already indexed this update, skipping!');
      return true;
    }
    return false;
  }

  async ingestEvent(decodedEvent: DecodedPixelMapTransaction) {
    // Skip event if it's a transfer to the wrapper, it's just the first step of wrapping.
    const tile = await this.tile.findOne({ id: decodedEvent.location }, [
      'dataHistory',
      'purchaseHistory',
      'wrappingHistory',
      'transferHistory',
    ]);

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

        // Someone set the price to 12000000000000000000000000000000000000 >_< this is to prevent overflow in Postgres
        if (tile.price > 99999) {
          tile.price = 99999;
        }

        tile.dataHistory.add(
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
        await this.tile.persist(tile);
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
        tile.purchaseHistory.add(
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
        await this.tile.persist(tile);
        break;
      case TransactionType.wrap:
        if (await this.alreadyIndexedWrap(this.wrappingHistory, decodedEvent.txHash)) {
          this.logger.warn('Already indexed this wrap, skipping!');
          return;
        }
        this.logger.log('Tile wrapped at block: ' + decodedEvent.blockNumber + ' (' + decodedEvent.timestamp + ')');
        tile.wrapped = true;
        tile.owner = decodedEvent.from;

        tile.wrappingHistory.add(
          new WrappingHistory({
            wrapped: true,
            tx: decodedEvent.txHash,
            timeStamp: decodedEvent.timestamp,
            blockNumber: decodedEvent.blockNumber,
            updatedBy: decodedEvent.from,
            logIndex: decodedEvent.logIndex,
          }),
        );
        await this.tile.persist(tile);
        break;
      case TransactionType.unwrap:
        if (await this.alreadyIndexedWrap(this.wrappingHistory, decodedEvent.txHash)) {
          this.logger.warn('Already indexed this unwrap, skipping!');
          return;
        }
        this.logger.log('Tile unwrapped at block: ' + decodedEvent.blockNumber + ' (' + decodedEvent.timestamp + ')');
        tile.wrapped = false;
        tile.owner = decodedEvent.from;

        tile.wrappingHistory.add(
          new WrappingHistory({
            wrapped: false,
            tx: decodedEvent.txHash,
            timeStamp: decodedEvent.timestamp,
            blockNumber: decodedEvent.blockNumber,
            updatedBy: decodedEvent.from,
            logIndex: decodedEvent.logIndex,
          }),
        );
        await this.tile.persist(tile);
        break;
      case TransactionType.transfer:
        if (await this.alreadyIndexed(this.transferHistory, decodedEvent.txHash, decodedEvent.logIndex)) {
          this.logger.warn('Already indexed this transfer, skipping!');
          return;
        }
        this.logger.log('Tile transferred at block: ' + decodedEvent.blockNumber + ' (' + decodedEvent.timestamp + ')');
        tile.owner = decodedEvent.from;

        tile.transferHistory.add(
          new TransferHistory({
            tx: decodedEvent.txHash,
            timeStamp: decodedEvent.timestamp,
            blockNumber: decodedEvent.blockNumber,
            transferredFrom: decodedEvent.to,
            transferredTo: decodedEvent.from,
            logIndex: decodedEvent.logIndex,
          }),
        );
        await this.tile.persist(tile);
        break;
      default:
        this.logger.error('Failed to account for the following event:');
        console.log(decodedEvent);
        exit();
    }
  }
}
