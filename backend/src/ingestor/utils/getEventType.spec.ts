import { EventType, getEventType } from './getEventType';
import { PixelMapEvent } from '../entities/pixelMapEvent.entity';

it('returns TileUpdated when given an OG contract TileUpdated event', async () => {
  const event = new PixelMapEvent({
    eventData: { topics: ['0xb497d17d9ddaf07c831248da6ed8174689abdc4370285e618e350f29f5aff9a0'] },
  });
  const eventType = await getEventType(event);
  expect(eventType).toBe(EventType.TileUpdated);
});

it('returns Transfer when given a wrapper contract transfer event', async () => {
  const event = new PixelMapEvent({
    eventData: { topics: ['0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'] },
  });
  const eventType = await getEventType(event);
  expect(eventType).toBe(EventType.Transfer);
});

it('returns Unwrapped when given a wrapper contract Unwrapped event', async () => {
  const event = new PixelMapEvent({
    eventData: { topics: ['0x95ae649bfaaef9def56a52f4fb2d9e8fa5496bb7082930e442c74cc76b03dcb3'] },
  });
  const eventType = await getEventType(event);
  expect(eventType).toBe(EventType.Unwrapped);
});

it('returns Wrapped when given a wrapper contract Wrapped event', async () => {
  const event = new PixelMapEvent({
    eventData: { topics: ['0x4700c1726b4198077cd40320a32c45265a1910521eb0ef713dd1d8412413d7fc'] },
  });
  const eventType = await getEventType(event);
  expect(eventType).toBe(EventType.Wrapped);
});
