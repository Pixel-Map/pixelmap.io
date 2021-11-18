import { PixelMapEvent } from '../entities/pixelMapEvent.entity';
import { ethers } from 'ethers';
import { initializeEthersJS } from './initializeEthersJS';
import { EventType, getEventType } from './getEventType';
import { getTimestamp } from './getTimestamp';
import { Repository } from 'typeorm';
import { Tile } from '../entities/tile.entity';

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
  from: string;
  to: string;
  image: string;
  url: string;
  timestamp: Date;
}

export async function decodeTransaction(
  event: PixelMapEvent,
  tileRepository: Repository<Tile>,
): Promise<DecodedPixelMapTransaction> {
  // console.log(JSON.stringify(event));
  const { provider, pixelMap, pixelMapWrapper } = initializeEthersJS();
  const eventType = await getEventType(event);
  // console.log(JSON.stringify(event));
  // console.log(event);
  const timestamp = await getTimestamp(event.txData.blockNumber);
  switch (eventType) {
    case EventType.TileUpdated:
      if (event.txData.to.toLowerCase() === pixelMapWrapper.address.toLowerCase()) {
        // If the transfer is TO the PixelMapWrapper, this is a wrap/minting of ERC721.
        const parsedTransaction = pixelMapWrapper.interface.parseTransaction(event.txData);
        const tileLocation = parsedTransaction.args._locationID.toNumber();
        return new DecodedPixelMapTransaction({
          location: tileLocation,
          type: TransactionType.wrap,
          price: parseFloat(ethers.utils.formatEther(parsedTransaction.value)),
          from: event.txData.from.toLowerCase(),
          timestamp: timestamp,
        });
      } else {
        const parsedTransaction = pixelMap.interface.parseTransaction(event.txData);
        const tileLocation = parsedTransaction.args.location.toNumber();
        if (parsedTransaction.name == 'buyTile') {
          const currentTileHistory = await tileRepository.findOne({ id: tileLocation });
          const previousOwner = currentTileHistory.owner;
          return new DecodedPixelMapTransaction({
            location: tileLocation,
            type: TransactionType.buyTile,
            price: parseFloat(ethers.utils.formatEther(parsedTransaction.value)),
            from: event.txData.from.toLowerCase(),
            to: previousOwner,
            timestamp: timestamp,
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
          });
        }
      }
    case EventType.Transfer:
      if (event.txData.to.toLowerCase() === pixelMapWrapper.address.toLowerCase()) {
        // If the transfer is TO the PixelMapWrapper, this is a wrap/minting of ERC721.
        const parsedTransaction = pixelMapWrapper.interface.parseTransaction(event.txData);
        const tileLocation = parsedTransaction.args._locationID.toNumber();
        return new DecodedPixelMapTransaction({
          location: tileLocation,
          type: TransactionType.wrap,
          price: parseFloat(ethers.utils.formatEther(parsedTransaction.value)),
          from: event.txData.from.toLowerCase(),
          timestamp: timestamp,
        });
      }
    case EventType.Wrapped:
      console.log(event);
      const parsedTransaction = pixelMapWrapper.interface.parseTransaction(event.txData);
      const tileLocation = parsedTransaction.args._locationID.toNumber();
      return new DecodedPixelMapTransaction({
        location: tileLocation,
        type: TransactionType.wrap,
        price: parseFloat(ethers.utils.formatEther(parsedTransaction.value)),
        from: event.txData.from.toLowerCase(),
        timestamp: timestamp,
      });

    default:
      // console.log(JSON.stringify(event));
      // console.log(event);
      throw 'IDK Clown';
  }

  //
  // if (event.eventData.topics.length > 1) {
  //   if (
  //     event.eventData.topics[0] == pixelMapWrapper.filters.Wrapped().topics[0] &&
  //     event.txData.to.toLowerCase() == pixelMapWrapper.address.toLowerCase()
  //   ) {
  //     const decodedTx = pixelMapWrapper.interface.parseTransaction(event.txData);
  //     return new DecodedPixelMapTransaction({
  //       type: TransactionType.wrap,
  //       location: decodedTx.args._location,
  //       from: event.txData.from,
  //       to: event.txData.to,
  //       value: event.txData,
  //     });
  //   }
  //   // return await manuallyDecodeTransaction(event, pixelMap, pixelMapWrapper, provider);
  // }
  // if (event.eventData.topics.pop() == pixelMap.filters.TileUpdated().topics[0]) {
  //   if (event.txData.to.toLowerCase() == pixelMapWrapper.address.toLowerCase()) {
  //     // return pixelMapWrapper.interface.parseTransaction(event.txData);
  //   } else {
  //     // return pixelMap.interface.parseTransaction(event.txData);
  //   }
  // }

  throw 'Unable to decode transaction.';
}

async function manuallyDecodeTransaction(event: PixelMapEvent, pixelMap, pixelMapWrapper, provider) {
  let parsedLog;
  if (event.eventData.topics[0] == pixelMapWrapper.filters.Transfer().topics[0]) {
    parsedLog = pixelMapWrapper.interface.parseLog(event.eventData);
    const value: number = parseInt(ethers.utils.formatEther(event.txData.value));
    // console.log(event);
    if (value > 0) {
      // The tile was sold, likely via OpenSea.
      return new DecodedPixelMapTransaction({
        type: TransactionType.buyTile,
        location: parsedLog.location,
        from: event.txData.from,
        to: event.txData.to,
        price: event.txData,
      });
    }
    throw 'HELP';
  }
  return {
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
    value: 5,
    from: 'adsadasdas',
    location: 5,
  };
}
