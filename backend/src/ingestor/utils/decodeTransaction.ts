import { PixelMapEvent } from '../entities/pixelMapEvent.entity';
import { ethers } from 'ethers';
import * as pixelMapABI from '../../../../abi/PixelMap.json';
import * as pixelMapWrapperABI from '../../../../abi/PixelMapWrapper.json';

enum TransactionType {
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
  value: number;
  from: string;
  to: string;
  image: string;
  url: string;
  timestamp: Date;
}

export async function decodeTransaction(event: PixelMapEvent, provider): Promise<DecodedPixelMapTransaction> {
  console.log(event);
  // // Initialize Contracts
  // const pixelMap = new ethers.Contract('0x015a06a433353f8db634df4eddf0c109882a15ab', pixelMapABI, provider);
  // const pixelMapWrapper = new ethers.Contract(
  //   '0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b',
  //   pixelMapWrapperABI,
  //   provider,
  // );
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
    console.log(event);
    if (value > 0) {
      // The tile was sold, likely via OpenSea.
      return new DecodedPixelMapTransaction({
        type: TransactionType.buyTile,
        location: parsedLog.location,
        from: event.txData.from,
        to: event.txData.to,
        value: event.txData,
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
