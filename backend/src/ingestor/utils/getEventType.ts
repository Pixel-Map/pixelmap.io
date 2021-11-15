import { initializeEthersJS } from './initializeEthersJS';

export enum EventType {
  TileUpdated,
  Transfer,
  Wrapped,
  Unwrapped,
}
export async function getEventType(event): Promise<EventType> {
  const { pixelMap, pixelMapWrapper } = initializeEthersJS();
  switch (event.eventData.topics[0]) {
    case pixelMap.filters.TileUpdated().topics[0]:
      return EventType.TileUpdated;
    case pixelMapWrapper.filters.Transfer().topics[0]:
      return EventType.Transfer;
    case pixelMapWrapper.filters.Unwrapped().topics[0]:
      return EventType.Unwrapped;
    case pixelMapWrapper.filters.Wrapped().topics[0]:
      return EventType.Wrapped;
    default:
      throw 'Unexpected EventType, or invalid event!';
  }
}
