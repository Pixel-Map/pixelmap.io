import { initializeEthersJS } from './initializeEthersJS';
import { ethers } from 'ethers';
import { Logger } from '@nestjs/common';

// Expect total events so far: 19110 (2641570 -> 13787439)
// pixelMapWrapper.filters.Transfer().topics[0],
// pixelMapWrapper.filters.Unwrapped().topics[0],
// pixelMapWrapper.filters.Wrapped().topics[0],
export async function getEvents(firstBlock: number, lastMinedBlock: number, logger: Logger) {
  const BLOCKS_TO_PROCESS_AT_TIME = 1000;
  // const firstBlock = 2641570;
  // const lastMinedBlock = 13787439;
  let currentBlock = firstBlock;
  const allEvents: ethers.Event[] = [];
  const { provider, pixelMap, pixelMapWrapper } = initializeEthersJS();

  // Filters
  const tileUpdatedFilter = pixelMap.filters.TileUpdated();
  const transferFilter = pixelMapWrapper.filters.Transfer();
  const unwrappedFilter = pixelMapWrapper.filters.Unwrapped();
  const wrappedFilter = pixelMapWrapper.filters.Wrapped();

  while (currentBlock < lastMinedBlock) {
    // // Secret Teleportation past nothingness
    // if (currentBlock > 3974343 && currentBlock < 13062712) {
    //   logger.log('Teleporting past the land of nothingness!');
    //   currentBlock = 13062713;
    // }

    let toBlock = currentBlock + BLOCKS_TO_PROCESS_AT_TIME;
    if (toBlock > lastMinedBlock) {
      toBlock = lastMinedBlock;
    }
    const tileUpdatedEvents = await pixelMap.queryFilter(tileUpdatedFilter, currentBlock, toBlock);
    const transferEvents = await pixelMapWrapper.queryFilter(transferFilter, currentBlock, toBlock);
    const unwrappedEvents = await pixelMapWrapper.queryFilter(unwrappedFilter, currentBlock, toBlock);
    const wrappedEvents = await pixelMapWrapper.queryFilter(wrappedFilter, currentBlock, toBlock);

    // Push Events
    allEvents.push(...tileUpdatedEvents);
    allEvents.push(...transferEvents);
    allEvents.push(...unwrappedEvents);
    allEvents.push(...wrappedEvents);

    logger.log(
      'Scanning (inclusive) from: ' + currentBlock + ' to ' + toBlock + '.  Total events so far: ' + allEvents.length,
    );
    currentBlock = toBlock + 1;
  }

  // Sort by blockNumber, and if tied, sort by transactionIndex
  const sorted = allEvents.sort((a, b) =>
    a.blockNumber > b.blockNumber
      ? 1
      : a.blockNumber === b.blockNumber
      ? a.transactionIndex > b.transactionIndex
        ? 1
        : -1
      : -1,
  );

  return sorted;
}
