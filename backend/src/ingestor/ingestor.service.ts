import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { ethers } from 'ethers';

import * as pixelMapABI from '../../../abi/PixelMap.json';
import * as pixelMapWrapperABI from '../../../abi/PixelMapWrapper.json';
import * as wyvernExchangeABI from '../../../abi/WyvernExchange.json';
import { Block } from './entities/block.entity';
import { Repository } from 'typeorm';
import { Tile } from './entities/tile.entity';
import { DataHistory } from './entities/dataHistory.entity';
import { PurchaseHistory } from './entities/purchaseHistory.entity';
import { WrappingHistory } from './entities/wrappingHistory.entity';
import { exit } from '@nestjs/cli/actions';
import { TransferHistory } from './entities/transferHistory.entity';

@Injectable()
export class IngestorService {
  private readonly logger = new Logger(IngestorService.name);
  private provider: ethers.providers.JsonRpcProvider;
  private pixelMap: ethers.Contract;
  private pixelMapWrapper: ethers.Contract;
  private wyvernExchange: ethers.Contract; // OpenSea contract
  constructor(
    @InjectRepository(Block)
    private blockRepository: Repository<Block>,
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

  @Cron(new Date(Date.now() + 5000)) // Start 5 seconds after App startup
  async listenToBlocks() {
    this.initializeEthersJS();
    await this.initializeData();
    const lastSavedBlock = await this.blockRepository.findOne();
    let lastIngestedBlock = lastSavedBlock.currentBlock;
    let endBlock = lastIngestedBlock + 10;
    const mostRecentBlockNumber = await this.provider.getBlockNumber();

    while (endBlock < mostRecentBlockNumber) {
      this.logger.log('Processing blocks: ' + lastIngestedBlock + ' - ' + endBlock);
      try {
        const events = await this.provider.send('eth_getLogs', [
          {
            address: [this.pixelMap.address, this.pixelMapWrapper.address],
            fromBlock: ethers.BigNumber.from(lastIngestedBlock).toHexString(),
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
        await this.blockRepository.save(
          this.blockRepository.create({
            id: 1,
            currentBlock: endBlock,
          }),
        );
        lastIngestedBlock = endBlock;
        endBlock = lastIngestedBlock + 10;
      } catch (error) {
        this.logger.warn('Error while ingesting.  Retrying');
        this.logger.warn(error);
        exit();
      }
    }
  }

  /*
   * initializeTileData is used to seed the database
   */
  async initializeData() {
    const lastIngestedBlock = await this.blockRepository.findOne();
    if (lastIngestedBlock == undefined) {
      this.logger.log('Starting fresh, start of contract! (2641527)');
      await this.blockRepository.save({ id: 1, currentBlock: 2641527 });
      for (let i = 0; i < 3970; i++) {
        await this.tile.save({
          id: i,
          price: 2,
          wrapped: false,
          image: '',
          url: '',
          owner: '0x4f4b7e7edf5ec41235624ce207a6ef352aca7050', // Creator of PixelMap
          dataHistory: [],
          wrappingHistory: [],
          purchaseHistory: [],
        });
      }
      this.logger.log('Initialization complete!');
    } else {
      this.logger.log('Initialization already completed, skipping.');
    }
  }

  /**
   * initializeEthersJS initializes the PixelMap and PixelMapWrapper contracts
   */
  initializeEthersJS() {
    this.provider = new ethers.providers.JsonRpcProvider(
      'https://eth-mainnet.alchemyapi.io/v2/qF8INKOtYcPy3O8qE1rqzA3I8cmpcceM',
      'mainnet',
    );
    this.pixelMap = new ethers.Contract('0x015a06a433353f8db634df4eddf0c109882a15ab', pixelMapABI, this.provider);
    this.pixelMapWrapper = new ethers.Contract(
      '0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b',
      pixelMapWrapperABI,
      this.provider,
    );
    this.wyvernExchange = new ethers.Contract(
      '0x7be8076f4ea4a4ad08075c2508e481d6c946d12b',
      wyvernExchangeABI,
      this.provider,
    );
  }

  async decodeTransaction(event, transaction): Promise<ethers.utils.TransactionDescription> {
    let decodedTransaction;
    try {
      if (
        event.address == this.pixelMap.address &&
        transaction.to.toLowerCase() != this.pixelMapWrapper.address.toLowerCase()
      ) {
        decodedTransaction = this.pixelMap.interface.parseTransaction(transaction);
      } else {
        if (transaction.to.toLowerCase() == this.wyvernExchange.address.toLowerCase()) {
          decodedTransaction = this.wyvernExchange.interface.parseTransaction(transaction);
        } else {
          decodedTransaction = this.pixelMapWrapper.interface.parseTransaction(transaction);
        }
      }
      decodedTransaction.from = transaction.from;
      return decodedTransaction;
    } catch {
      this.logger.warn('Failed to parse using normal contracts, trying manually!');
      return this.manuallyDecodeTransaction(event, transaction);
    }
  }

  /*
   * manuallyDecodeTransactions is used for processing internal transactions (i.e. from a Proxy)
   * it requires a node with Trace enabled!!
   */
  async manuallyDecodeTransaction(event, transaction) {
    const parsedLog = this.pixelMap.interface.parseLog(event);
    if (parsedLog.name == 'TileUpdated') {
      // It's definitely something calling the OG contract, so is it a SetTile or a BuyTile?
      const tileId = parsedLog.args.location.toNumber();
      const tilePriorToUpdate = await this.pixelMap.tiles(tileId, { blockTag: event.blockNumber - 1 }).catch();
      const tileAfterUpdate = await this.pixelMap.tiles(tileId, { blockTag: event.blockNumber }).catch();
      if (tilePriorToUpdate.owner != tileAfterUpdate.owner) {
        this.logger.debug('Determined transaction was a buyTile!');
        const decodedTransaction = {
          args: [],
          name: 'buyTile',
          functionFragment: {
            constant: true,
            format: undefined,
            stateMutability: '',
            payable: true,
            type: 'Unknown',
            name: 'Unknown',
            inputs: [],
            _isFragment: true,
          },
          signature: 'Unknown',
          sighash: 'Unknown',
          value: tilePriorToUpdate.price,
          from: tileAfterUpdate.owner,
          location: tileId,
        };

        return decodedTransaction;
      } else {
        this.logger.debug('Determined transaction was a setTile!');
      }
    } else {
      throw 'Have no idea how to deal with this yet';
    }
  }

  async getFullBlock(blockNumber) {
    const rawBlock = await this.provider.send('eth_getBlockByNumber', [ethers.utils.hexValue(blockNumber), true]);
    return this.provider.formatter.blockWithTransactions(rawBlock);
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
      if (event.topics[0] == this.pixelMapWrapper.interface.getEventTopic('Transfer')) {
        tileId = parseInt(event.topics[3], 16);
      }
    }
    if (tileId > 3969) {
      throw 'Invalid tileID!!';
    }
    let tile = await this.tile.findOne({ id: tileId });
    if (tile == undefined) {
      tile = this.tile.create({ id: tileId });
      tile.wrapped = false;
    }
    return tile;
  }

  async processEvents(events) {
    for (let i = 0; i < events.length; i++) {
      // for is serial, forEach is parallel (i.e. asynchronous)
      const event = events[i];
      const transaction = await this.provider.getTransaction(event.transactionHash);
      console.log(event);
      console.log(transaction);

      const decodedTransaction = await this.decodeTransaction(event, transaction);
      const fullBlock = await this.getFullBlock(transaction.blockNumber);
      const tile = await this.getTile(decodedTransaction, event);
      // console.log(event);
      // console.log(transaction);
      // console.log(decodedTransaction);
      switch (decodedTransaction.name) {
        case 'setTile':
          await this.processSetTile(tile, event, transaction, decodedTransaction, fullBlock);
          break;
        case 'setTileData':
          await this.processSetTile(tile, event, transaction, decodedTransaction, fullBlock);
          break;
        case 'buyTile':
          await this.processPurchasedTile(tile, event, transaction, decodedTransaction, fullBlock);
          break;
        case 'wrap':
          await this.processWrappedTile(tile, event, transaction, decodedTransaction, fullBlock);
          break;
        case 'unwrap':
          await this.processUnwrappedTile(tile, event, transaction, decodedTransaction, fullBlock);
          break;
        case 'atomicMatch_': // Sold via OpenSea WyvernExchange Contract
          await this.processPurchasedTile(tile, event, transaction, decodedTransaction, fullBlock);
          break;
        case 'transferFrom':
          await this.processTransferredTile(tile, event, transaction, decodedTransaction, fullBlock);
          break;
        case 'safeTransferFrom':
          await this.processTransferredTile(tile, event, transaction, decodedTransaction, fullBlock);
          break;
        default:
          this.logger.error('Failed to account for the following event:');
          console.log('Event: ');
          console.log(event);
          console.log('Transaction:');
          console.log(transaction);
          console.log('Decoded Transaction');
          console.log(decodedTransaction);
          exit();
      }
    }
  }

  async processPurchasedTile(tile: Tile, event, transaction, decodedTransaction, fullBlock) {
    this.logger.log('Tile sold at block: ' + transaction.blockNumber);
    if (tile.purchaseHistory.some((e) => e.tx === event.transactionHash)) {
      this.logger.warn('Already indexed this purchase, skipping!');
      return;
    }
    const purchaseHistory = new PurchaseHistory();
    purchaseHistory.price = parseFloat(ethers.utils.formatEther(decodedTransaction.value)); // Convert Gwei
    if (purchaseHistory.price == 0) {
      console.log(event);
      console.log(transaction);
      console.log(decodedTransaction);
      throw 'Purchase could never be for zero, what?';
    }
    purchaseHistory.soldBy = tile.owner;
    purchaseHistory.purchasedBy = transaction.from;
    purchaseHistory.tx = event.transactionHash;
    purchaseHistory.timeStamp = new Date(fullBlock.timestamp * 1000);
    purchaseHistory.blockNumber = transaction.blockNumber;
    tile.owner = decodedTransaction.from; // Update AFTER updating purchasedBy!
    tile.price = 0; // Price is always set to zero following a sale!s
    tile.purchaseHistory.push(purchaseHistory);
    // console.log(tile);
    await this.tile.save(tile);
  }

  async processSetTile(tile: Tile, event, transaction, decodedTransaction, fullBlock) {
    this.logger.log('Tile updated at block: ' + transaction.blockNumber);
    if (tile.dataHistory.some((e) => e.tx === event.transactionHash)) {
      this.logger.warn('Already indexed this data, skipping!');
      return;
    }
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

    tile.owner = transaction.from;

    const dataHistory = new DataHistory();
    if (decodedTransaction.args.price != undefined) {
      dataHistory.price = parseFloat(ethers.utils.formatEther(decodedTransaction.args.price));
    } else {
      dataHistory.price = tile.price;
    }

    dataHistory.url = tile.url;
    dataHistory.tx = event.transactionHash;
    dataHistory.timeStamp = new Date(fullBlock.timestamp * 1000);
    dataHistory.blockNumber = transaction.blockNumber;
    dataHistory.image = tile.image;
    dataHistory.updatedBy = transaction.from;
    tile.dataHistory.push(dataHistory);
    await this.tile.save(tile);
  }

  async processWrappedTile(tile: Tile, event, transaction, decodedTransaction, fullBlock) {
    this.logger.log('Tile wrapped at block: ' + transaction.blockNumber);
    if (tile.wrappingHistory.some((e) => e.tx === event.transactionHash)) {
      this.logger.warn('Already indexed this wrapping, skipping!');
      return;
    }
    tile.wrapped = true;
    tile.owner = transaction.from;
    const wrappingHistory = new WrappingHistory();
    wrappingHistory.wrapped = true;
    wrappingHistory.tx = event.transactionHash;
    wrappingHistory.timeStamp = new Date(fullBlock.timestamp * 1000);
    wrappingHistory.blockNumber = transaction.blockNumber;
    wrappingHistory.updatedBy = transaction.from;
    tile.wrappingHistory.push(wrappingHistory);
    await this.tile.save(tile);
  }

  async processUnwrappedTile(tile: Tile, event, transaction, decodedTransaction, fullBlock) {
    this.logger.log('Tile unwrapped at block: ' + transaction.blockNumber);
    if (tile.wrappingHistory.some((e) => e.tx === event.transactionHash)) {
      this.logger.warn('Already indexed this unwrapping, skipping!');
      return;
    }
    tile.wrapped = false;
    tile.owner = transaction.from;
    const wrappingHistory = new WrappingHistory();
    wrappingHistory.wrapped = false;
    wrappingHistory.tx = event.transactionHash;
    wrappingHistory.timeStamp = new Date(fullBlock.timestamp * 1000);
    wrappingHistory.blockNumber = transaction.blockNumber;
    wrappingHistory.updatedBy = transaction.from;
    tile.wrappingHistory.push(wrappingHistory);
    await this.tile.save(tile);
  }

  async processTransferredTile(tile: Tile, event, transaction, decodedTransaction, fullBlock) {
    this.logger.log('Tile transferred at block: ' + transaction.blockNumber);
    if (tile.transferHistory.some((e) => e.tx === event.transactionHash)) {
      this.logger.warn('Already indexed this transfer, skipping!');
      return;
    }
    tile.owner = decodedTransaction.args.to;
    const transferHistory = new TransferHistory();
    transferHistory.tx = event.transactionHash;
    transferHistory.timeStamp = new Date(fullBlock.timestamp * 1000);
    transferHistory.blockNumber = transaction.blockNumber;
    transferHistory.transferredFrom = transaction.from;
    transferHistory.transferredTo = decodedTransaction.args.to;
    tile.transferHistory.push(transferHistory);
    await this.tile.save(tile);
  }
}
