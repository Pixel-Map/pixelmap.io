import { PixelMapEvent } from '../entities/pixelMapEvent.entity';
import { ethers } from 'ethers';
import { EventType, getEventType } from './getEventType';
import { getTimestamp } from './getTimestamp';

export enum TransactionType {
  setTile,
  buyTile,
  wrap,
  unwrap,
  transfer,
}

export class DecodedPixelMapTransaction {
  public constructor(init?: Partial<DecodedPixelMapTransaction>) {
    Object.assign(this, init);
  }
  location: number;
  type: TransactionType;
  price: number;
  from: string; // The person paying, typically this is the BUYER of a tile or RECEIVER of a tile
  to: string; // The person receiving money, typically this is the SELLER of a tile
  image: string;
  url: string;
  timestamp: Date;
  txHash: string;
  blockNumber: number;
  logIndex: number;
}

export async function decodeTransaction(
  pixelMap: ethers.Contract,
  pixelMapWrapper: ethers.Contract,
  event: PixelMapEvent,
): Promise<DecodedPixelMapTransaction> {
  const eventType = await getEventType(event);
  // console.log(JSON.stringify(event));

  let parsedTransaction: ethers.utils.TransactionDescription;
  let tileLocation: number; // Which tile is it?
  const timestamp = await getTimestamp(event.txData.blockNumber);
  switch (eventType) {
    case EventType.TileUpdated:
      if (event.txData.to.toLowerCase() === pixelMapWrapper.address.toLowerCase()) {
        // If the transfer is TO the PixelMapWrapper, this could be a wrap/minting of ERC721.
        parsedTransaction = pixelMapWrapper.interface.parseTransaction(event.txData);
        tileLocation = parsedTransaction.args._locationID.toNumber();
        switch (parsedTransaction.name) {
          case 'wrap':
            return new DecodedPixelMapTransaction({
              location: tileLocation,
              type: TransactionType.wrap,
              price: parseFloat(ethers.utils.formatEther(parsedTransaction.value)),
              from: event.txData.from.toLowerCase(),
              timestamp: timestamp,
              txHash: event.txHash,
              blockNumber: event.txData.blockNumber,
              logIndex: event.logIndex,
            });
          case 'unwrap':
            return new DecodedPixelMapTransaction({
              location: tileLocation,
              type: TransactionType.unwrap,
              price: parseFloat(ethers.utils.formatEther(parsedTransaction.value)),
              from: event.txData.from.toLowerCase(),
              timestamp: timestamp,
              txHash: event.txHash,
              blockNumber: event.txData.blockNumber,
              logIndex: event.logIndex,
            });
          case 'setTileData':
            return new DecodedPixelMapTransaction({
              location: tileLocation,
              type: TransactionType.setTile,
              image: parsedTransaction.args._image,
              url: parsedTransaction.args._url,
              from: event.txData.from.toLowerCase(),
              timestamp: timestamp,
              txHash: event.txHash,
              blockNumber: event.txData.blockNumber,
              logIndex: event.logIndex,
            });
          default:
            throw new Error(`Unknown transaction type: ${parsedTransaction.name}`);
        }
      } else {
        try {
          parsedTransaction = pixelMap.interface.parseTransaction(event.txData);
          tileLocation = parsedTransaction.args.location.toNumber();
          if (parsedTransaction.name == 'buyTile') {
            const previousData = await pixelMap.tiles(tileLocation, { blockTag: event.txData.blockNumber - 1 });

            // The first owner was myself.
            let owner = previousData.owner;
            if (owner == '0x0000000000000000000000000000000000000000') {
              owner = '0x4f4b7e7edf5ec41235624ce207a6ef352aca7050';
            }

            // If owned by wrapper
            if (owner.toLowerCase() == '0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b'.toLowerCase()) {
              owner = await pixelMapWrapper.ownerOf(tileLocation, { blockTag: event.txData.blockNumber - 1 });
            }

            return new DecodedPixelMapTransaction({
              location: tileLocation,
              type: TransactionType.buyTile,
              price: parseFloat(ethers.utils.formatEther(parsedTransaction.value)),
              from: event.txData.from.toLowerCase(),
              to: owner,
              timestamp: timestamp,
              txHash: event.txHash,
              blockNumber: event.txData.blockNumber,
              logIndex: event.logIndex,
            });
          }

          if (parsedTransaction.name == 'setTile') {
            return new DecodedPixelMapTransaction({
              location: tileLocation,
              type: TransactionType.setTile,
              image: parsedTransaction.args.image,
              url: parsedTransaction.args.url,
              price: parseFloat(ethers.utils.formatEther(parsedTransaction.args.price)),
              from: event.txData.from.toLowerCase(),
              timestamp: timestamp,
              txHash: event.txHash,
              blockNumber: event.txData.blockNumber,
              logIndex: event.logIndex,
            });
          }
        } catch (exception) {
          // console.log('Unable to parse using normal methods, figuring out via block comparison');
          const parsedLog = await pixelMap.interface.parseLog(event.eventData);
          const tileId = parsedLog.args.location.toNumber();
          const tilePriorToUpdate = await pixelMap.tiles(tileId, { blockTag: event.block - 1 }).catch();
          const tileAfterUpdate = await pixelMap.tiles(tileId, { blockTag: event.block }).catch();
          if (tilePriorToUpdate.owner != tileAfterUpdate.owner) {
            // Tis a buyTile!
            return new DecodedPixelMapTransaction({
              type: TransactionType.buyTile,
              location: tileId,
              from: tileAfterUpdate.owner,
              to: tilePriorToUpdate.owner,
              price: parseFloat(ethers.utils.formatEther(tilePriorToUpdate.price)),
              timestamp: new Date('2021-08-26T22:35:01.000Z'),
              blockNumber: event.block,
              txHash: event.txHash,
              logIndex: event.logIndex,
            });
          } else {
            // Tis a setTile!
            throw 'Implement my friend';
          }
        }
      }
      break;
    case EventType.Transfer:
      const price = parseFloat(ethers.utils.formatEther(event.txData.value));
      if (event.txData.to.toLowerCase() === pixelMapWrapper.address.toLowerCase()) {
        parsedTransaction = pixelMapWrapper.interface.parseTransaction(event.txData);

        if (parsedTransaction.args._locationID) {
          tileLocation = parsedTransaction.args._locationID.toNumber();

          // If the transfer is TO the PixelMapWrapper, this is a wrap/minting of ERC721.
          return new DecodedPixelMapTransaction({
            location: tileLocation,
            type: TransactionType.wrap,
            price: price,
            from: event.txData.from.toLowerCase(),
            timestamp: timestamp,
            txHash: event.txHash,
            blockNumber: event.txData.blockNumber,
            logIndex: event.logIndex,
          });
        } else {
          tileLocation = parsedTransaction.args.tokenId.toNumber();
        }
      }
      const parsedLog = pixelMapWrapper.interface.parseLog(event.eventData);
      // If not a wrap, is it a sale?
      if (price > 0) {
        return new DecodedPixelMapTransaction({
          location: parsedLog.args.tokenId.toNumber(),
          type: TransactionType.buyTile,
          price: price,
          from: parsedLog.args.to.toLowerCase(),
          to: parsedLog.args.from.toLowerCase(),
          timestamp: timestamp,
          txHash: event.txHash,
          blockNumber: event.txData.blockNumber,
          logIndex: event.logIndex,
        });
      }
      // Must have just been a regular transfer!
      return new DecodedPixelMapTransaction({
        location: parsedLog.args.tokenId.toNumber(),
        type: TransactionType.transfer,
        price: price,
        from: parsedLog.args.to.toLowerCase(),
        to: parsedLog.args.from.toLowerCase(),
        timestamp: timestamp,
        txHash: event.txHash,
        blockNumber: event.txData.blockNumber,
        logIndex: event.logIndex,
      });
    case EventType.Wrapped:
      parsedTransaction = pixelMapWrapper.interface.parseTransaction(event.txData);
      tileLocation = parsedTransaction.args._locationID.toNumber();
      return new DecodedPixelMapTransaction({
        location: tileLocation,
        type: TransactionType.wrap,
        price: parseFloat(ethers.utils.formatEther(parsedTransaction.value)),
        from: event.txData.from.toLowerCase(),
        timestamp: timestamp,
        txHash: event.txHash,
        blockNumber: event.txData.blockNumber,
        logIndex: event.logIndex,
      });
    case EventType.Unwrapped:
      parsedTransaction = pixelMapWrapper.interface.parseTransaction(event.txData);
      tileLocation = parsedTransaction.args._locationID.toNumber();
      return new DecodedPixelMapTransaction({
        location: tileLocation,
        type: TransactionType.unwrap,
        price: parseFloat(ethers.utils.formatEther(parsedTransaction.value)),
        from: event.txData.from.toLowerCase(),
        timestamp: timestamp,
        txHash: event.txHash,
        blockNumber: event.txData.blockNumber,
        logIndex: event.logIndex,
      });
    default:
      // console.log(JSON.stringify(event));
      // console.log(event);
      throw 'IDK Clown';
  }

  throw 'Unable to decode transaction.';
}
