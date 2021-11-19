import { PixelMapEvent } from '../entities/pixelMapEvent.entity';
import * as ogSampleBuyTile from './fixtures/og-sample-buyTile.json';
import * as ogSampleSetTile from './fixtures/og-sample-setTile.json';
import * as wrappingSample1 from './fixtures/sample-tileWrapped-e1.json';
import * as wrappingSample2 from './fixtures/sample-tileWrapped-e2.json';
import * as wrappingSample3 from './fixtures/sample-tileWrapped-e3.json';
import * as openseaPurchase from './fixtures/opensea-purchase.json';
import * as delegatedBuyTile from './fixtures/delegated-buyTile.json';

import { DecodedPixelMapTransaction, decodeTransaction, TransactionType } from './decodeTransaction';
import { createConnection, getConnection, getRepository } from 'typeorm';
import { Tile } from '../entities/tile.entity';
import { DataHistory } from '../entities/dataHistory.entity';
import { WrappingHistory } from '../entities/wrappingHistory.entity';
import { TransferHistory } from '../entities/transferHistory.entity';
import { PurchaseHistory } from '../entities/purchaseHistory.entity';

beforeEach(() => {
  return createConnection({
    type: 'sqlite',
    database: ':memory:',
    dropSchema: true,
    entities: [Tile, DataHistory, WrappingHistory, TransferHistory, PurchaseHistory],
    synchronize: true,
    logging: false,
  });
});

afterEach(() => {
  const conn = getConnection();
  return conn.close();
});

it('returns a proper buyTile DecodedTransaction when given an OG contract buyTile event', async () => {
  const event = Object.assign(new PixelMapEvent(), ogSampleBuyTile);
  const tileRepository = await getRepository(Tile);
  await tileRepository.save({
    id: 1984,
    price: 2,
    wrapped: false,
    image: '',
    url: '',
    owner: '0x4f4b7e7edf5ec41235624ce207a6ef352aca7050', // Creator of PixelMap
    dataHistory: [],
    wrappingHistory: [],
    purchaseHistory: [],
  });
  const decodedTransaction = await decodeTransaction(event, tileRepository);
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
    }),
  );
});

it('returns a proper setTile DecodedTransaction when given an OG contract setTile event', async () => {
  const event = Object.assign(new PixelMapEvent(), ogSampleSetTile);
  const tileRepository = await getRepository(Tile);
  const decodedTransaction = await decodeTransaction(event, tileRepository);
  expect(decodedTransaction).toStrictEqual(
    new DecodedPixelMapTransaction({
      location: 1984,
      type: TransactionType.setTile,
      price: 0,
      image:
        // eslint-disable-next-line max-len
        '5974964964974964964964964964964974964974974964974964965975965964964964964964964964974965964974964964964974974964965964964964964964964974964964964965972433543645974964964964964974753533544864964965971211212334865964964964964863641221224864964974964974973861114974964964961112435974965974964965970211212111111111211211111111210211214754974864652432432331111111111111111112222433444553753650115974974751110111111221111112435964961322324965974a7243232497010354486111496364111496486496596497122364486496111254486111597486375132476497496597011365496597142365486232496496497211576496497597111364496497597497496597496496496010475496496597497597496496597496596496497496597586597497497597497496597597496497496496596497496496597497496496496496496496496496496496496496496496496496',
      url: 'www.ethereum.org',
      from: '0xc20daa952d35677eb5dc40b8e0be84920f40ad68',
      timestamp: new Date('2016-11-17T04:44:03.000Z'),
      blockNumber: 2641577,
      txHash: '0x5ea7c8839918bf46f41622c2ca576b1d3724014f7c9cb3a1243dcf6416dcf62d',
    }),
  );
});

it('returns a wrappedTile DecodedTransaction when given the first (1/3) wrapping event', async () => {
  const event = Object.assign(new PixelMapEvent(), wrappingSample1);
  const tileRepository = await getRepository(Tile);
  const decodedTransaction = await decodeTransaction(event, tileRepository);
  expect(decodedTransaction).toStrictEqual(
    new DecodedPixelMapTransaction({
      location: 3459,
      type: TransactionType.wrap,
      price: 4,
      from: '0x4aeb32e16dcac00b092596adc6cd4955efdee290',
      timestamp: new Date('2021-08-26T21:08:49.000Z'),
      blockNumber: 13103379,
      txHash: '0x3feba41d9ccc7c7078e820438d11481bbc4bf3f8b0fd3ab023eea205d14a85f2',
    }),
  );
});

it('returns a wrappedTile DecodedTransaction when given the second (2/3) wrapping event', async () => {
  const event = Object.assign(new PixelMapEvent(), wrappingSample2);
  const tileRepository = await getRepository(Tile);
  const decodedTransaction = await decodeTransaction(event, tileRepository);
  expect(decodedTransaction).toStrictEqual(
    new DecodedPixelMapTransaction({
      location: 3459,
      type: TransactionType.wrap,
      price: 4,
      from: '0x4aeb32e16dcac00b092596adc6cd4955efdee290',
      timestamp: new Date('2021-08-26T21:08:49.000Z'),
      blockNumber: 13103379,
      txHash: '0x3feba41d9ccc7c7078e820438d11481bbc4bf3f8b0fd3ab023eea205d14a85f2',
    }),
  );
});

it('returns a wrappedTile DecodedTransaction when given the third (3/3) wrapping event', async () => {
  const event = Object.assign(new PixelMapEvent(), wrappingSample3);
  const tileRepository = await getRepository(Tile);
  const decodedTransaction = await decodeTransaction(event, tileRepository);
  expect(decodedTransaction).toStrictEqual(
    new DecodedPixelMapTransaction({
      location: 3459,
      type: TransactionType.wrap,
      price: 4,
      from: '0x4aeb32e16dcac00b092596adc6cd4955efdee290',
      timestamp: new Date('2021-08-26T21:08:49.000Z'),
      blockNumber: 13103379,
      txHash: '0x3feba41d9ccc7c7078e820438d11481bbc4bf3f8b0fd3ab023eea205d14a85f2',
    }),
  );
});

it('returns a buyTile DecodedTransaction when given an OpenSea purchase transfer event', async () => {
  const event = Object.assign(new PixelMapEvent(), openseaPurchase);
  const tileRepository = await getRepository(Tile);
  const decodedTransaction = await decodeTransaction(event, tileRepository);
  expect(decodedTransaction).toStrictEqual(
    new DecodedPixelMapTransaction({
      location: 222,
      type: TransactionType.buyTile,
      price: 6,
      from: '0x59165f6219936b1e6a970c44f750d588d1f5d558',
      to: '0x60ceef10f9dd4a5d7874f22f461048ea96f475f6',
      timestamp: new Date('2021-08-26T22:35:01.000Z'),
      blockNumber: 13103747,
      txHash: '0xb054bf1c08cb269c51e773e3f5d2135a27885087904bfa89389bdbdd1240a71e',
    }),
  );
});

it('returns a buyTile DecodedTransaction when given a delegated purchase transfer event', async () => {
  const event = Object.assign(new PixelMapEvent(), delegatedBuyTile);
  const tileRepository = await getRepository(Tile);
  const decodedTransaction = await decodeTransaction(event, tileRepository);
  expect(decodedTransaction).toStrictEqual(
    new DecodedPixelMapTransaction({
      location: 896,
      type: TransactionType.buyTile,
      price: 3.55,
      from: '0xb34a4bbc546f3218008ba78dec5cd9773e237da6',
      to: '0xb17bFA989e00c7b0d17e52d3e90Db440d2d7Ee5f',
      timestamp: new Date('2021-08-26T22:35:01.000Z'),
    }),
  );
});
