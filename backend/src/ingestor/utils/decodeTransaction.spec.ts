import * as ogSampleBuyTile from './fixtures/og-sample-buyTile.json';
import * as ogSampleSetTile from './fixtures/og-sample-setTile.json';
import * as wrappingSample1 from './fixtures/sample-tileWrapped.json';
import * as setTileData from './fixtures/sample-setTileData.json';
import * as unwrapping from './fixtures/sample-unwrap.json';
import * as safeTransferFrom from './fixtures/sample-safeTransferFrom.json';
import * as transfer from './fixtures/sample-transfer.json';

import { DecodedPixelMapTransaction, decodeTransaction, TransactionType } from './decodeTransaction';
import { initializeEthersJS } from './initializeEthersJS';
import { PixelMapTransaction } from '../entities/pixelMapTransaction.entity';

describe('decodeTransaction', () => {
  const { provider, pixelMap, pixelMapWrapper } = initializeEthersJS();
  // afterAll(() => {
  //   provider._websocket.terminate();
  // });

  it('returns a proper buyTile DecodedTransaction when given an OG contract buyTile event', async () => {
    const event = Object.assign(new PixelMapTransaction(), ogSampleBuyTile);
    const decodedTransaction = await decodeTransaction(pixelMap, pixelMapWrapper, event);
    expect(decodedTransaction).toStrictEqual(
      new DecodedPixelMapTransaction({
        location: 1984,
        type: TransactionType.buyTile,
        price: 2,
        from: '0xc20daa952d35677eb5dc40b8e0be84920f40ad68',
        to: '0x4f4b7e7edf5ec41235624ce207a6ef352aca7050',
        timestamp: new Date('2016-11-17T04:41:08.000Z'),
        blockNumber: 2641570,
        txHash: '0x64feae306ab228a93a56fad5c4855e317958d9f5d8423168aecdc163756925b6',
        logIndex: 3,
      }),
    );
  });

  it('returns a proper setTile DecodedTransaction when given an OG contract setTile event', async () => {
    const event = Object.assign(new PixelMapTransaction(), ogSampleSetTile);

    const decodedTransaction = await decodeTransaction(pixelMap, pixelMapWrapper, event);
    expect(decodedTransaction).toStrictEqual(
      new DecodedPixelMapTransaction({
        location: 1985,
        type: TransactionType.setTile,
        price: 0,
        image:
          '000000000000000000000000000bf59d49c48b37a3793be5000000000000000000bf5ad47937937937937937938c4be6000000000' +
          '000bf58c47937937937937937937937a3bf69c5000000000ae47937937937937937937937937a30009c59c50000008c4793793793' +
          '7937937937937937a3000bf69c59c5000ae47937937937937937937937938b3000cf69c59c5ae6bf5793793793793793793793793' +
          '8b4000cf69c59c59c5bf6ae4793793793793793793793bf5000bf69c59c59c59c5bf68b37937937937937938b4bf5000bf6ad59c5' +
          '9c59c59c5cf67937937937938b3bf5000000cf6ad59c59c59c59c5ae60007937a3bf5bf5000000000bf69c59c59c59c59c59c5cf6' +
          '000000000000000000000cf69c59c59c59c59c59c5ae6000000000000000000cf69c59c59c59c59c59c59c59c5cf6000000cf6cf6' +
          'bf69c59c59c59c59c59c59c59c59c5bf6000000000000cf69c59c59c59c59c59c59c59c5cf6000000000000000000000000bf6be6' +
          'ad5ad5bf6bf6cf6000000000000000000',
        url: 'www.bitfinex.com/?refcode=Sw264GOhVk',
        from: '0x52dc81ef890f6f4ceeea4c0f0d8ebc32e049074a',
        timestamp: new Date('2017-07-04T19:13:47.000Z'),
        blockNumber: 3974343,
        txHash: '0x44920bf6ec91d5f97eed7567d88bab564c56869a3e08536360896af9a4719671',
        logIndex: 82,
      }),
    );
  });

  it('returns a wrappedTile DecodedTransaction when given the first (1/3) wrapping event', async () => {
    const event = Object.assign(new PixelMapTransaction(), wrappingSample1);
    const decodedTransaction = await decodeTransaction(pixelMap, pixelMapWrapper, event);
    expect(decodedTransaction).toStrictEqual(
      new DecodedPixelMapTransaction({
        location: 3459,
        type: TransactionType.wrap,
        price: 4,
        from: '0x4aeb32e16dcac00b092596adc6cd4955efdee290',
        timestamp: new Date('2021-08-26T21:08:49.000Z'),
        blockNumber: 13103379,
        txHash: '0x3feba41d9ccc7c7078e820438d11481bbc4bf3f8b0fd3ab023eea205d14a85f2',
        logIndex: 103,
      }),
    );
  });

  it('returns an unwrapTile DecodedTransaction when given an unwrapping event', async () => {
    const event = Object.assign(new PixelMapTransaction(), unwrapping);
    const decodedTransaction = await decodeTransaction(pixelMap, pixelMapWrapper, event);
    expect(decodedTransaction).toStrictEqual(
      new DecodedPixelMapTransaction({
        location: 1034,
        type: TransactionType.unwrap,
        price: 0,
        from: '0x4f4b7e7edf5ec41235624ce207a6ef352aca7050',
        timestamp: new Date('2021-08-27T05:04:12.000Z'),
        blockNumber: 13105522,
        txHash: '0x4a3359f5b5ed5500fd88847e44b67a6b70fc433ba70a303613fe963f5a97ac45',
        logIndex: 73,
      }),
    );
  });
  it('returns a transfer DecodedTransaction when given a transfer event', async () => {
    const event = Object.assign(new PixelMapTransaction(), transfer);
    const decodedTransaction = await decodeTransaction(pixelMap, pixelMapWrapper, event);
    expect(decodedTransaction).toStrictEqual(
      new DecodedPixelMapTransaction({
        location: 3570,
        type: TransactionType.transfer,
        price: 0,
        from: '0x6d5c43265a3107e95c629cf3e8428eb9275dba13',
        to: '0x38ecf50ada3b087be4a0e52fea50b388b416992f',
        timestamp: new Date('2021-08-27T06:05:00.000Z'),
        txHash: '0x2bb3203913d34d29338c90343fae99b4af1dcebf9bd58db5310bac7fc3f9d6ff',
        blockNumber: 13105786,
        logIndex: 85,
      }),
    );
  });

  it('returns a transfer DecodedTransaction when given a safeTransferFrom event', async () => {
    const event = Object.assign(new PixelMapTransaction(), safeTransferFrom);
    const decodedTransaction = await decodeTransaction(pixelMap, pixelMapWrapper, event);
    expect(decodedTransaction).toStrictEqual(
      new DecodedPixelMapTransaction({
        location: 1541,
        type: TransactionType.transfer,
        price: 0,
        from: '0xd20ce27f650598c2d790714b4f6a7222b8ddce22',
        to: '0xd317a3744f60c5cbcde7c82df90a6513409198a2',
        timestamp: new Date('2021-08-27T13:02:50.000Z'),
        txHash: '0xffec1a259ca648a0c64b38161abddd7a0bac9a6e5a6d69a8a55c29734b5a0432',
        blockNumber: 13107569,
        logIndex: 25,
      }),
    );
  });

  it('returns a proper setTile DecodedTransaction when given a wrapper setTileData event', async () => {
    const event = Object.assign(new PixelMapTransaction(), setTileData);
    const decodedTransaction = await decodeTransaction(pixelMap, pixelMapWrapper, event);
    expect(decodedTransaction).toStrictEqual(
      new DecodedPixelMapTransaction({
        location: 1371,
        type: TransactionType.setTile,
        image:
          '000666fff999000666666666666999666000fff000ccc333fff666666ccc999333666666666999333999000fff6669990006669993' +
          '33ccc333333333666999666999ccc000666999999000ccc333fff000999ccc000ccc333003333ccc9996663339993333339cc9cc69' +
          '9666ccc66669c69c9cc33333366666666666636c69c69c36936969c9cc9cc9cc9cf333666666999999999ccc39c33636939c69c9cc' +
          '9cf9cf9cc6663336666666666660009cc33636933669c69c669ccffff66633366666666633366633333636936939c699ccf9cc9993' +
          '33666666666666333ccc33336636936969c9ccccf666666999666666666666333000ccc33339969c69c9cfccf33300033366699966' +
          '6333ccc666000333666666000000999333ccccccccc333999999999333333333666999ffffffccc333fffccc666999ccc666000ccc' +
          'ccc333ccc000999ccc333333ccc333ccc000999666fff333999333999666666333666666999666000ccc000ccc000fff0009996666' +
          '66666666666666000999ccc333',
        url: 'https://twitter.com/ScreenieBabies',
        from: '0xe6ee1b79627243ee40ec929fe2573e63d70b10c4',
        timestamp: new Date('2021-08-27T06:45:59.000Z'),
        blockNumber: 13180007,
        txHash: '0x4b7639a49c4652b51b9b265c40be13a6654ef4c8f91d6729737d316e64801485',
        logIndex: 37,
      }),
    );
  });
});
