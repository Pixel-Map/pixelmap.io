import { type Contract, ethers } from "ethers";
import type { Logger } from "@nestjs/common";
import type { EntityRepository } from "@mikro-orm/core";
import type { Tile } from "../entities/tile.entity";
import { initializeEthersJS } from "./initializeEthersJS";

export async function updateAllTileData(
	pixelMap: Contract,
	pixelMapWrapper: Contract,
	logger: Logger,
	tileRepo: EntityRepository<Tile>,
) {
	const batchSize = 100; // Adjust based on your needs
	const { provider } = initializeEthersJS();

	for (let i = 0; i < 3970; i += batchSize) {
		try {
			const tilePromises = [];
			for (let j = i; j < Math.min(i + batchSize, 3970); j++) {
				tilePromises.push(
					getCurrentTileData(j, pixelMap, pixelMapWrapper, provider),
				);
			}
			const updatedTilesData = await Promise.all(tilePromises);

			const tiles = await tileRepo.find({
				id: { $in: updatedTilesData.map((t) => t.id) },
			});

			for (const tile of tiles) {
				const updatedData = updatedTilesData.find((t) => t.id === tile.id);
				Object.assign(tile, updatedData);
			}

			await tileRepo.getEntityManager().persistAndFlush(tiles);
			logger.verbose(
				`Updated tiles ${i} to ${Math.min(i + batchSize - 1, 3969)}`,
			);
		} catch (error) {
			console.error(error);
			logger.verbose(
				`Error updating tiles ${i} to ${Math.min(i + batchSize - 1, 3969)}`,
			);
		}
	}
}

export async function getCurrentTileData(
	tileId: number,
	pixelMap: Contract,
	pixelMapWrapper: Contract,
	provider: ethers.JsonRpcProvider,
) {
	const tileData = await pixelMap.tiles(tileId);
	const owner = await getOwner(tileData.owner, tileId, pixelMapWrapper);
	const ens = await provider.lookupAddress(owner);

	return {
		id: tileId,
		image: tileData.image,
		url: tileData.url,
		price: Number.parseFloat(ethers.formatEther(tileData.price)),
		wrapped: isWrapped(tileData.owner),
		owner: owner,
		ens: ens ? ens : "",
	};
}

// Returns true if the tile is wrapped
function isWrapped(owner: string) {
	return owner.toLowerCase() === "0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b";
}

// getOwner returns the real owner of a given tile.
async function getOwner(owner: string, tileId: number, pixelMapWrapper) {
	// If never owned before, then owned by the creator of the contract
	switch (owner.toLowerCase()) {
		case "0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b":
			return await pixelMapWrapper.ownerOf(tileId);
		case "0x0000000000000000000000000000000000000000":
			return "0x4f4b7e7edf5ec41235624ce207a6ef352aca7050";
		default:
			return owner;
	}
}
