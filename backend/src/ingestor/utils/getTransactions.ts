import { Logger } from '@nestjs/common';
import axios from 'axios';
import { sortEvents } from './sortEvents';

// Get transactions from Etherscan API
export async function getTransactions(firstBlock: number, lastMinedBlock: number, etherscanAPIKey, logger: Logger) {
  const BLOCKS_TO_PROCESS_AT_TIME = 1000;

  let currentBlock = firstBlock;
  const allTransactions = [];

  while (currentBlock < lastMinedBlock) {
    let toBlock = currentBlock + BLOCKS_TO_PROCESS_AT_TIME;
    if (toBlock > lastMinedBlock) {
      toBlock = lastMinedBlock;
    }
    const ogContractEvents = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'txlist',
        startblock: currentBlock,
        endblock: toBlock,
        address: '0x015A06a433353f8db634dF4eDdF0C109882A15AB',
        apikey: etherscanAPIKey,
      },
    });
    const wrapperContractEvents = await axios.get('https://api.etherscan.io/api', {
      params: {
        module: 'account',
        action: 'txlist',
        startblock: currentBlock,
        endblock: toBlock,
        address: '0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b',
        apikey: etherscanAPIKey,
      },
    });
    if (ogContractEvents.data.result.length > 10000 || wrapperContractEvents.data.result.length > 10000) {
      throw 'Received more than 10k records from etherscan, which means we need to paginate!';
    }
    const ogTransactions = ogContractEvents.data.result.map((tx) => ({
      ...tx,
      contractAddress: '0x015A06a433353f8db634dF4eDdF0C109882A15AB',
    }));

    const wrapperTransactions = wrapperContractEvents.data.result.map((tx) => ({
      ...tx,
      contractAddress: '0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b',
    }));
    allTransactions.push(...ogTransactions);
    allTransactions.push(...wrapperTransactions);

    logger.log(
      'Scanning (inclusive) from: ' +
        currentBlock +
        ' to ' +
        toBlock +
        '.  Total transactions so far: ' +
        allTransactions.length,
    );
    currentBlock = toBlock + 1;
  }

  // Sort by blockNumber, and if tied, sort by transactionIndex
  return sortEvents(allTransactions);
}
