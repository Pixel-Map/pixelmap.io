import type { ethers } from "ethers";
import type { PixelMapTransaction } from "../entities/pixelMapTransaction.entity";

export function getTransactionDescription(
	pixelMap: ethers.Contract,
	pixelMapWrapper: ethers.Contract,
	transaction: PixelMapTransaction,
) {
	if (
		transaction.contractAddress.toLowerCase() ===
		pixelMap.target.toString().toLowerCase()
	) {
		return pixelMap.interface.parseTransaction({
			data: transaction.input,
			value: transaction.value,
		});
	}
	if (
		transaction.contractAddress.toString().toLowerCase() ===
		pixelMapWrapper.target.toString().toLowerCase()
	) {
		return pixelMapWrapper.interface.parseTransaction({
			data: transaction.input,
			value: transaction.value,
		});
	}
	throw "Unable to getTransactionDescription, either wrong contract, or invalid data input?";
}
