import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
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
import { updateAllTileData } from './utils/updateAllTileData';
import { getTransactions } from './utils/getTransactions';
import { PixelMapTransaction } from './entities/pixelMapTransaction.entity';
import { ConfigService } from '@nestjs/config';

const fs = require('fs');

@Injectable()
export class IngestorService {
  private readonly logger = new Logger(IngestorService.name);
  private currentlyRunningSync = true;
  private currentlyIngestingEvents = false;
  private currentlyIngestingTransactions = false;
  private updatingCurrentTileData = false;

  constructor(
    @InjectRepository(CurrentState)
    private currentState: EntityRepository<CurrentState>,
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
    @InjectRepository(PixelMapTransaction)
    private pixelMapTransaction: EntityRepository<PixelMapTransaction>,
    private readonly orm: MikroORM,
    private configService: ConfigService,
  ) {}

  async onApplicationBootstrap() {
    this.currentlyIngestingEvents = true;

    // Create directories if they don't exist
    if (!fs.existsSync('cache/metadata')) {
      fs.mkdirSync('cache/metadata', { recursive: true });
    }
    if (!fs.existsSync('cache/tile')) {
      fs.mkdirSync('cache/tile', { recursive: true });
    }

    // Initialize Data if Empty
    if ((await this.currentState.findOne({ state: StatesToTrack.INGESTION_LAST_ETHERSCAN_BLOCK })) == undefined) {
      this.logger.log('Starting fresh, start of events! (0)');
      await this.currentState.persistAndFlush([
        new CurrentState({
          state: StatesToTrack.INGESTION_LAST_PROCESSED_PIXEL_MAP_TX,
          value: 0,
        }),
        new CurrentState({
          state: StatesToTrack.NOTIFICATIONS_LAST_PROCESSED_TILE_CHANGE,
          value: 0,
        }),
        new CurrentState({
          state: StatesToTrack.RENDERER_LAST_PROCESSED_DATA_CHANGE,
          value: 0,
        }),
        new CurrentState({
          state: StatesToTrack.INGESTION_LAST_ETHERSCAN_BLOCK,
          value: 2641527,
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
        await this.tile.persistAndFlush(tile);
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
    // await this.syncBlocks();
    await this.syncTransactions();
    this.currentlyRunningSync = false;
    // await this.resyncEveryMinute(); // Let's kick it off once so I don't have to wait a minute.
  }

  @Cron('45 * * * * *')
  async resyncEveryMinute() {
    if (this.currentlyRunningSync) {
      this.logger.log('Already syncing, skipping');
    } else {
      this.logger.debug('Syncing again, one moment.');
      this.currentlyRunningSync = true;
      await this.syncTransactions();
      this.currentlyRunningSync = false;
    }
  }

  async syncTransactions() {
    const { provider } = initializeEthersJS();
    const lastBlock = await this.currentState.findOne({ state: StatesToTrack.INGESTION_LAST_ETHERSCAN_BLOCK });
    let mostRecentBlockNumber = await provider.getBlockNumber();
    mostRecentBlockNumber = mostRecentBlockNumber - 10; // Let's stay 10 away from latest in case of uncles etc.

    // Do batches of 1,000,000 max before saving!
    if (mostRecentBlockNumber - lastBlock.value > 100000) {
      mostRecentBlockNumber = lastBlock.value + 100000;
    }

    // Download raw events
    this.logger.log('Downloading raw transactions from block: ' + lastBlock.value + ' to ' + mostRecentBlockNumber);
    let rawTXs = [];
    try {
      rawTXs = await getTransactions(
        lastBlock.value,
        mostRecentBlockNumber,
        this.configService.get('ETHERSCAN_API_KEY'),
        this.logger,
      );
    } catch (err) {
      this.logger.error('Error downloading raw events');
      console.log(err);
      return;
    }

    // Process raw events and store them in the database
    this.logger.debug('Processing blocks from block: ' + lastBlock.value + ' to ' + mostRecentBlockNumber);

    await this.processTransactions(rawTXs);
    lastBlock.value = mostRecentBlockNumber + 1;
    await this.currentState.persistAndFlush(lastBlock);

    this.logger.debug('Finished syncing.  Will check again soon.');
  }

  async processTransactions(transactions) {
    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      if (await this.pixelMapTransaction.findOne({ hash: tx.hash, transactionIndex: tx.transactionIndex })) {
        this.logger.warn('Already indexed this tx, skipping!');
        return;
      } else {
        this.logger.log('Saving tx at block: ' + tx.blockNumber);
        const pixelMapTx = new PixelMapTransaction({
          blockNumber: tx.blockNumber,
          timeStamp: tx.timeStamp,
          hash: tx.hash,
          nonce: tx.nonce,
          blockHash: tx.blockHash,
          transactionIndex: tx.transactionIndex,
          from: tx.from,
          to: tx.to,
          value: tx.value,
          gas: tx.gas,
          gasPrice: tx.gasPrice,
          isError: tx.isError,
          txreceipt_status: tx.txreceipt_status,
          input: tx.input,
          contractAddress: tx.contractAddress,
          cumulativeGasUsed: tx.cumulativeGasUsed,
          gasUsed: tx.gasUsed,
          confirmations: tx.confirmations,
        });
        await this.pixelMapTransaction.persistAndFlush(pixelMapTx);
      }
    }
    await this.pixelMapTransaction.flush();
  }

  @Cron('0 * * * *')
  @UseRequestContext()
  async updateCurrentTileData() {
    const { provider, pixelMap, pixelMapWrapper } = initializeEthersJS();
    console.log('Updating current tile data');
    if (!this.updatingCurrentTileData) {
      this.updatingCurrentTileData = true;
      try {
        await updateAllTileData(pixelMap, pixelMapWrapper, this.logger, this.tile);
        this.updatingCurrentTileData = false;
      } catch (e) {
        this.logger.error('Error updating current tile data: ' + e);
      }
    }
  }

  @Cron('1 * * * * *')
  @UseRequestContext()
  async ingestTransactions() {
    if (!this.currentlyIngestingTransactions) {
      const { provider, pixelMap, pixelMapWrapper } = initializeEthersJS();
      this.currentlyIngestingTransactions = true;

      const lastTx = await this.currentState.findOne({
        state: StatesToTrack.INGESTION_LAST_PROCESSED_PIXEL_MAP_TX,
      });

      const transactions = await this.pixelMapTransaction.find({}, { orderBy: { id: QueryOrder.ASC } });

      for (let i = lastTx.value; i < transactions.length; i++) {
        if (transactions[i].isError == '1') {
          this.logger.log('Skipping transaction that errored out: ' + transactions[i].hash);
        } else {
          const decodedTransaction = await decodeTransaction(pixelMap, pixelMapWrapper, transactions[i]);

          await this.ingestEvent(decodedTransaction);
          const percent = Math.round((100 * (i + 1)) / transactions.length);
          this.logger.verbose(
            i +
              1 +
              '/' +
              transactions.length +
              ' transactions processed (' +
              percent +
              '% complete) - ' +
              transactions[i].id,
          );
          lastTx.value = i;
          await this.currentState.persistAndFlush(lastTx);
        }
      }

      this.currentlyIngestingTransactions = false;
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

        tile.image = decodedEvent.image ? decodedEvent.image.substring(0, 799) : tile.image.substring(0, 799);
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
            image: tile.image.substring(0, 799),
            updatedBy: decodedEvent.from,
            logIndex: decodedEvent.logIndex,
          }),
        );
        await this.tile.persistAndFlush(tile);
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
          console.log(decodedEvent);
          throw 'Purchase cannot be 0 or less';
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
        await this.tile.persistAndFlush(tile);
        break;
      case TransactionType.wrap:
        await this.addWrappingHistory(decodedEvent, tile, true);
        break;
      case TransactionType.unwrap:
        await this.addWrappingHistory(decodedEvent, tile, false);
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
        await this.tile.persistAndFlush(tile);
        break;
      case TransactionType.createContract:
        this.logger.log('Contract created at block ' + decodedEvent.blockNumber);
        break;
      case TransactionType.getTile:
        this.logger.log('GetTile called at block ' + decodedEvent.blockNumber);
        break;
      case TransactionType.notImportant:
        this.logger.log('Something not important was called at block ' + decodedEvent.blockNumber);
        break;
      default:
        this.logger.error('Failed to account for the following event:');
        console.log(decodedEvent);
        exit();
    }
  }

  async addWrappingHistory(decodedEvent: DecodedPixelMapTransaction, tile: Tile, wrapped: boolean) {
    if (await this.alreadyIndexedWrap(this.wrappingHistory, decodedEvent.txHash)) {
      const noun = wrapped ? 'wrapping' : 'unwrapping';
      this.logger.warn('Already indexed this ' + noun + ', skipping!');
      return;
    }
    this.logger.log('Tile wrapped at block: ' + decodedEvent.blockNumber + ' (' + decodedEvent.timestamp + ')');
    tile.wrappingHistory.add(
      new WrappingHistory({
        wrapped: wrapped,
        tx: decodedEvent.txHash,
        timeStamp: decodedEvent.timestamp,
        blockNumber: decodedEvent.blockNumber,
        updatedBy: decodedEvent.from,
        logIndex: decodedEvent.logIndex,
      }),
    );
    await this.tile.persistAndFlush(tile);
  }
}
