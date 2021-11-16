import { PixelMapEvent } from '../entities/pixelMapEvent.entity';
import * as ogSampleBuyTile from './fixtures/og-sample-buyTile.json';
import { DecodedPixelMapTransaction, decodeTransaction, TransactionType } from './decodeTransaction';

it('returns a proper buyTile DecodedTransaction when given an OG contract buyTile event', async () => {
  const event = Object.assign(new PixelMapEvent(), ogSampleBuyTile);
  const decodedTransaction = await decodeTransaction(event);
  expect(decodedTransaction).toBe(
    new DecodedPixelMapTransaction({
      location: 1984,
      type: TransactionType.buyTile,
      value: 2,
      from: '0xc20daa952d35677eb5dc40b8e0be84920f40ad68',
      to: '0x4f4b7e7edf5ec41235624ce207a6ef352aca7050',
      timestamp: new Date(),
    }),
  );
});
