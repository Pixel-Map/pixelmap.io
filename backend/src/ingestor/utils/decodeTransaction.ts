import { ethers } from "ethers";
import type { PixelMapTransaction } from "../entities/pixelMapTransaction.entity";
import { getTransactionDescription } from "./getTransactionDescription";
import { getCurrentOwner } from "./getCurrentOwner";

export enum TransactionType {
	setTile,
	buyTile,
	wrap,
	unwrap,
	transfer,
	createContract,
	getTile,
	notImportant,
}

export class DecodedPixelMapTransaction {
	public constructor(init?: Partial<DecodedPixelMapTransaction>) {
		Object.assign(this, init);
	}

	location: number;
	type: TransactionType;
	price: number;
	from: string; // The person paying, typically this is the BUYER of a tile or RECEIVER of a tile
	to: string; // The person receiving money, typically this is the SELLER of a tile
	image: string;
	url: string;
	timestamp: Date;
	txHash: string;
	blockNumber: number;
	logIndex: number;
}

export async function decodeTransaction(
	pixelMap: ethers.Contract,
	pixelMapWrapper: ethers.Contract,
	transaction: PixelMapTransaction,
): Promise<DecodedPixelMapTransaction> {
	// Contract Creation Event
	if (
		transaction.hash.toLowerCase() ===
			"0x79e41799591e99ffb0aad02d270ac92328e441d0d6a0e49fd6cb9948efb40656" ||
		transaction.hash.toLowerCase() ===
			"0x7982bdc73900590ee3d1239341c6390eebcc2ee2b39041d382ee7762ce7586db"
	) {
		return new DecodedPixelMapTransaction({
			type: TransactionType.createContract,
			blockNumber: Number.parseInt(transaction.blockNumber),
		});
	}

	const txDescription = getTransactionDescription(
		pixelMap,
		pixelMapWrapper,
		transaction,
	);
	const tileLocation = Number.parseInt(txDescription.args[0]);
	const timestamp = new Date(Number.parseInt(transaction.timeStamp) * 1000);
	switch (txDescription.name) {
		case "buyTile":
			const owner = await getCurrentOwner(
				pixelMap,
				pixelMapWrapper,
				transaction,
				tileLocation,
			);
			return new DecodedPixelMapTransaction({
				location: tileLocation,
				type: TransactionType.buyTile,
				price: Number.parseFloat(ethers.formatEther(transaction.value)),
				from: transaction.from.toLowerCase(),
				to: owner,
				timestamp: timestamp,
				txHash: transaction.hash,
				blockNumber: Number.parseInt(transaction.blockNumber),
				logIndex: Number.parseInt(transaction.transactionIndex),
			});
		case "setTile":
			return new DecodedPixelMapTransaction({
				location: tileLocation,
				type: TransactionType.setTile,
				price: Number.parseFloat(ethers.formatEther(transaction.value)),
				image: txDescription.args[1],
				url: txDescription.args[2],
				from: transaction.from.toLowerCase(),
				timestamp: timestamp,
				txHash: transaction.hash,
				blockNumber: Number.parseInt(transaction.blockNumber),
				logIndex: Number.parseInt(transaction.transactionIndex),
			});
		case "wrap":
			return new DecodedPixelMapTransaction({
				location: tileLocation,
				type: TransactionType.wrap,
				price: Number.parseFloat(ethers.formatEther(transaction.value)),
				from: transaction.from.toLowerCase(),
				timestamp: timestamp,
				txHash: transaction.hash,
				blockNumber: Number.parseInt(transaction.blockNumber),
				logIndex: Number.parseInt(transaction.transactionIndex),
			});
		case "unwrap":
			return new DecodedPixelMapTransaction({
				location: tileLocation,
				type: TransactionType.unwrap,
				price: Number.parseFloat(ethers.formatEther(transaction.value)),
				from: transaction.from.toLowerCase(),
				timestamp: timestamp,
				txHash: transaction.hash,
				blockNumber: Number.parseInt(transaction.blockNumber),
				logIndex: Number.parseInt(transaction.transactionIndex),
			});
		case "transferFrom":
			return new DecodedPixelMapTransaction({
				location: Number.parseInt(txDescription.args[2]),
				type: TransactionType.transfer,
				price: Number.parseFloat(ethers.formatEther(transaction.value)),
				from: txDescription.args[1].toLowerCase(),
				to: txDescription.args[0].toLowerCase(),
				timestamp: timestamp,
				txHash: transaction.hash,
				blockNumber: Number.parseInt(transaction.blockNumber),
				logIndex: Number.parseInt(transaction.transactionIndex),
			});
		case "safeTransferFrom":
			return new DecodedPixelMapTransaction({
				location: Number.parseInt(txDescription.args[2]),
				type: TransactionType.transfer,
				price: Number.parseFloat(ethers.formatEther(transaction.value)),
				from: txDescription.args[1].toLowerCase(),
				to: txDescription.args[0].toLowerCase(),
				timestamp: timestamp,
				txHash: transaction.hash,
				blockNumber: Number.parseInt(transaction.blockNumber),
				logIndex: Number.parseInt(transaction.transactionIndex),
			});
		case "setTileData":
			return new DecodedPixelMapTransaction({
				location: tileLocation,
				type: TransactionType.setTile,
				image: txDescription.args._image,
				url: txDescription.args._url,
				from: transaction.from.toLowerCase(),
				timestamp: timestamp,
				txHash: transaction.hash,
				blockNumber: Number.parseInt(transaction.blockNumber),
				logIndex: Number.parseInt(transaction.transactionIndex),
			});
		case "getTile":
			return new DecodedPixelMapTransaction({
				type: TransactionType.getTile,
				blockNumber: Number.parseInt(transaction.blockNumber),
			});
		case "setBaseTokenURI":
			return new DecodedPixelMapTransaction({
				type: TransactionType.notImportant,
				blockNumber: Number.parseInt(transaction.blockNumber),
			});
		case "setTokenExtension":
			return new DecodedPixelMapTransaction({
				type: TransactionType.notImportant,
				blockNumber: Number.parseInt(transaction.blockNumber),
			});
		case "setApprovalForAll":
			return new DecodedPixelMapTransaction({
				type: TransactionType.notImportant,
				blockNumber: Number.parseInt(transaction.blockNumber),
			});
		case "withdrawETH":
			return new DecodedPixelMapTransaction({
				type: TransactionType.notImportant,
				blockNumber: Number.parseInt(transaction.blockNumber),
			});
		case "approve":
			return new DecodedPixelMapTransaction({
				type: TransactionType.notImportant,
				blockNumber: Number.parseInt(transaction.blockNumber),
			});
		default:
			console.log(JSON.stringify(transaction));
			console.log(transaction);
			console.log(txDescription);
			throw "Unknown Transaction Type!";
	}
}
