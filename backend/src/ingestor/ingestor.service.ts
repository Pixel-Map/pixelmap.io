import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { ethers } from 'ethers';
import { Block } from './entities/block.entity';
import { Repository } from 'typeorm';
import { PixelMapEvent } from './entities/pixelMapEvent.entity';
import * as pixelMapABI from '../../../abi/PixelMap.json';
import * as pixelMapWrapperABI from '../../../abi/PixelMapWrapper.json';
import { Tile } from './entities/tile.entity';
import { DataHistory } from './entities/dataHistory.entity';
import { PurchaseHistory } from './entities/purchaseHistory.entity';
import { WrappingHistory } from './entities/wrappingHistory.entity';
import { TransferHistory } from './entities/transferHistory.entity';
import { exit } from '@nestjs/cli/actions';
const BLOCKS_TO_PROCESS_AT_TIME = 1;

@Injectable()
export class IngestorService {
  private readonly logger = new Logger(IngestorService.name);
  private provider: ethers.providers.JsonRpcProvider;
  private pixelMap: ethers.Contract;
  private pixelMapWrapper: ethers.Contract;
  private lastDownloadedBlock;
  private currentlyRunningSync = true;

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
  initializeEthersJS() {
    this.provider = new ethers.providers.JsonRpcProvider(
      'https://mainnet.infura.io/v3/1e060d0190124285a48e3fe7165e3282',
      'mainnet',
    );
    this.pixelMap = new ethers.Contract('0x015a06a433353f8db634df4eddf0c109882a15ab', pixelMapABI, this.provider);
    this.pixelMapWrapper = new ethers.Contract(
      '0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b',
      pixelMapWrapperABI,
      this.provider,
    );
  }

  @Cron(new Date(Date.now() + 5000)) // Start 5 seconds after App startup
  async initialStartup() {
    this.initializeEthersJS();
    let lastBlock = await this.blocks.findOne();
    if (lastBlock == undefined) {
      this.logger.log('Starting fresh, start of contract! (2641527)');
      lastBlock = await this.blocks.save({
        id: 1,
        currentDownloadedBlock: 2641527,
        currentIngestedBlock: 0,
      });
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
      await this.ingestEvents();
      this.currentlyRunningSync = false;
    }
  }

  async syncBlocks() {
    let endBlock = this.lastDownloadedBlock + BLOCKS_TO_PROCESS_AT_TIME;
    const mostRecentBlockNumber = await this.provider.getBlockNumber();
    this.logger.log('Last downloaded block: ' + this.lastDownloadedBlock);
    this.logger.log('End block: ' + endBlock);
    this.logger.log('Most recent block: ' + mostRecentBlockNumber);
    while (endBlock < mostRecentBlockNumber) {
      this.logger.log('Processing blocks: ' + this.lastDownloadedBlock + ' - ' + endBlock);
      try {
        const events = await this.provider.send('eth_getLogs', [
          {
            address: [this.pixelMap.address, this.pixelMapWrapper.address],
            fromBlock: ethers.BigNumber.from(this.lastDownloadedBlock).toHexString(),
            toBlock: ethers.BigNumber.from(endBlock).toHexString(),
            topics: [
              [
                this.pixelMap.filters.TileUpdated().topics[0],
                this.pixelMapWrapper.filters.Transfer().topics[0],
                this.pixelMapWrapper.filters.Unwrapped().topics[0],
                this.pixelMapWrapper.filters.Wrapped().topics[0],
              ],
            ],
          },
        ]);

        await this.processEvents(events);
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

  async processEvents(events) {
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const transaction = await this.provider.getTransaction(event.transactionHash);
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
  }

  async ingestEvents() {
    const lastBlock = await this.blocks.findOne();
    const lastIngested = lastBlock.currentIngestedBlock;
    const events = await this.pixelMapEvent.find({
      skip: lastIngested,
      order: { id: 'ASC' },
    });
    for (let i = 0; i < events.length; i++) {
      await this.ingestEvent(events[i]);
      lastBlock.currentIngestedBlock = events[i].id;
      await this.blocks.save(lastBlock);
    }
  }

  async ingestEvent(event) {
    const decodedTransaction = await this.decodeTransaction(event);
    switch (decodedTransaction.name) {
      case 'setTile':
        await this.processSetTile(event, decodedTransaction);
        break;
      case 'buyTile':
        await this.processPurchasedTile(event, decodedTransaction);
        break;
      default:
        this.logger.error('Failed to account for the following event:');
        console.log('Event: ');
        console.log(event);
        console.log(decodedTransaction);
        exit();
    }
    //   case 'setTileData':
    //     await this.processSetTile(tile, event, transaction, decodedTransaction, fullBlock);
    //     break;

    //   case 'wrap':
    //     await this.processWrappedTile(tile, event, transaction, decodedTransaction, fullBlock);
    //     break;
    //   case 'unwrap':
    //     await this.processUnwrappedTile(tile, event, transaction, decodedTransaction, fullBlock);
    //     break;
    //   case 'atomicMatch_': // Sold via OpenSea WyvernExchange Contract
    //     await this.processPurchasedTile(tile, event, transaction, decodedTransaction, fullBlock);
    //     break;
    //   case 'transferFrom':
    //     await this.processTransferredTile(tile, event, transaction, decodedTransaction, fullBlock);
    //     break;
    //   case 'safeTransferFrom':
    //     await this.processTransferredTile(tile, event, transaction, decodedTransaction, fullBlock);
    //     break;

    // }
  }

  async decodeTransaction(event) {
    if (event.eventData.topics.length > 1) {
      console.log(event.eventData.topics);
      throw 'Found an event longer than one topic, WTH?';
    }
    if (event.eventData.topics.pop() == this.pixelMap.filters.TileUpdated().topics[0]) {
      return this.pixelMap.interface.parseTransaction(event.txData);
    }
    throw 'Unable to decode transaction.';
  }

  async processSetTile(event: PixelMapEvent, decodedTransaction: ethers.utils.TransactionDescription) {
    this.logger.log('Tile updated at block: ' + event.txData.blockNumber);
    const tile: Tile = await this.getTile(decodedTransaction, event);

    // Image for OG or Wrapper
    if (decodedTransaction.args.image != undefined) {
      tile.image = decodedTransaction.args.image;
    } else {
      tile.image = decodedTransaction.args._image;
    }

    // Price for OG or Wrapper
    if (decodedTransaction.args.price != undefined) {
      tile.price = parseFloat(ethers.utils.formatEther(decodedTransaction.args.price));
    } else {
      // Don't set price if from wrapper, it doesn't let you directly!
    }

    // URL for OG or Wrapper
    if (decodedTransaction.args.url != undefined) {
      tile.url = decodedTransaction.args.url;
    } else {
      tile.url = decodedTransaction.args._url;
    }

    tile.owner = event.txData.from;

    const dataHistory = new DataHistory();
    if (decodedTransaction.args.price != undefined) {
      dataHistory.price = parseFloat(ethers.utils.formatEther(decodedTransaction.args.price));
    } else {
      dataHistory.price = tile.price;
    }

    dataHistory.url = tile.url;
    dataHistory.tx = event.txHash;
    dataHistory.timeStamp = await this.getTimestamp(event.txData.blockNumber);
    dataHistory.blockNumber = event.txData.blockNumber;
    dataHistory.image = tile.image;
    dataHistory.updatedBy = event.txData.from;
    tile.dataHistory.push(dataHistory);
    await this.tile.save(tile);
  }

  async processPurchasedTile(event: PixelMapEvent, decodedTransaction) {
    const tile: Tile = await this.getTile(decodedTransaction, event);
    this.logger.log('Tile sold at block: ' + event.txData.blockNumber);
    const purchaseHistory = new PurchaseHistory();
    purchaseHistory.price = parseFloat(ethers.utils.formatEther(decodedTransaction.value)); // Convert Gwei
    if (purchaseHistory.price <= 0) {
      throw 'Purchase cannot be 0 or less';
    }
    purchaseHistory.soldBy = tile.owner;
    purchaseHistory.purchasedBy = event.txData.from;
    purchaseHistory.tx = event.txHash;
    purchaseHistory.timeStamp = await this.getTimestamp(event.txData.blockNumber);
    purchaseHistory.blockNumber = event.txData.blockNumber;
    tile.owner = decodedTransaction.from; // Update AFTER updating purchasedBy!
    tile.price = 0; // Price is always set to zero following a sale!s
    tile.purchaseHistory.push(purchaseHistory);
    // console.log(tile);
    await this.tile.save(tile);
  }

  async getTile(decodedTransaction, event) {
    let tileId: number;
    if (decodedTransaction.args.location != undefined) {
      tileId = decodedTransaction.args.location.toNumber();
    } else if (decodedTransaction.args._locationID != undefined) {
      tileId = decodedTransaction.args._locationID.toNumber();
    } else if (decodedTransaction.location != undefined) {
      tileId = decodedTransaction.location;
    } else {
      // Most likely OpenSea, let's see if we can find it in the topics.
      if (event.eventData.topics[0] == this.pixelMapWrapper.interface.getEventTopic('Transfer')) {
        tileId = parseInt(event.eventData.topics[3], 16);
      }
    }
    if (tileId > 3969) {
      throw 'Invalid tileID!!';
    }

    return await this.tile.findOne({ id: tileId });
  }

  async getTimestamp(blockNumber) {
    const rawBlock = await this.provider.send('eth_getBlockByNumber', [ethers.utils.hexValue(blockNumber), true]);
    return new Date(this.provider.formatter.blockWithTransactions(rawBlock).timestamp * 1000);
  }
}
