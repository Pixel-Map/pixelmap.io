import { getEvents } from './getEvents';
import { initializeEthersJS } from './initializeEthersJS';
import { Logger } from '@nestjs/common';

it('returns all events from contract', async () => {
  const logger = new Logger();
  const { pixelMap, pixelMapWrapper } = initializeEthersJS();
  const event = await getEvents(1, 10, logger);
});
