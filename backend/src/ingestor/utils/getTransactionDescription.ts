import { ethers } from 'ethers';
import { PixelMapTransaction } from '../entities/pixelMapTransaction.entity';

export function getTransactionDescription(
  pixelMap: ethers.Contract,
  pixelMapWrapper: ethers.Contract,
  transaction: PixelMapTransaction,
) {
  if (transaction.contractAddress.toLowerCase() == pixelMap.address.toLowerCase()) {
    return pixelMap.interface.parseTransaction({ data: transaction.input, value: transaction.value });
  } else if (transaction.contractAddress.toLowerCase() == pixelMapWrapper.address.toLowerCase()) {
    return pixelMapWrapper.interface.parseTransaction({ data: transaction.input, value: transaction.value });
  } else {
    throw 'Unable to getTransactionDescription, either wrong contract, or invalid data input?';
  }
}
