import { initializeEthersJS } from './initializeEthersJS';
import { ethers } from 'ethers';

export async function getTimestamp(blockNumber: number) {
  const { provider, pixelMap, pixelMapWrapper } = initializeEthersJS();
  const rawBlock = await provider.send('eth_getBlockByNumber', [ethers.utils.hexValue(blockNumber), true]);
  return new Date(provider.formatter.blockWithTransactions(rawBlock).timestamp * 1000);
}
