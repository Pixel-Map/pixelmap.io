import { Logger } from "@nestjs/common";
import axios from "axios";
import { sortEvents } from "./sortEvents";

// Get transactions from Etherscan API
export async function getTransactions(
	firstBlock: number,
	lastMinedBlock: number,
	etherscanAPIKey,
	logger: Logger,
) {
	const BLOCKS_TO_PROCESS_AT_TIME = 1000;
	const RATE_LIMIT_DELAY = 250; // 250ms delay between requests (4 req/sec to be safe)

	let currentBlock = firstBlock;
	const allTransactions = [];

	while (currentBlock < lastMinedBlock) {
		let toBlock = currentBlock + BLOCKS_TO_PROCESS_AT_TIME;
		if (toBlock > lastMinedBlock) {
			toBlock = lastMinedBlock;
		}

		try {
			const ogContractEvents = await makeRateLimitedRequest(
				"https://api.etherscan.io/api",
				{
					params: {
						module: "account",
						action: "txlist",
						startblock: currentBlock,
						endblock: toBlock,
						address: "0x015A06a433353f8db634dF4eDdF0C109882A15AB",
						apikey: etherscanAPIKey,
					},
				},
			);

			await sleep(RATE_LIMIT_DELAY);

			const wrapperContractEvents = await makeRateLimitedRequest(
				"https://api.etherscan.io/api",
				{
					params: {
						module: "account",
						action: "txlist",
						startblock: currentBlock,
						endblock: toBlock,
						address: "0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b",
						apikey: etherscanAPIKey,
					},
				},
			);

			// Check if the API responses are valid
			if (
				!Array.isArray(ogContractEvents.data.result) ||
				!Array.isArray(wrapperContractEvents.data.result)
			) {
				logger.error("Invalid API response", {
					ogResult: ogContractEvents.data,
					wrapperResult: wrapperContractEvents.data,
				});
				throw new Error("Invalid API response from Etherscan");
			}

			if (
				ogContractEvents.data.result.length > 10000 ||
				wrapperContractEvents.data.result.length > 10000
			) {
				throw new Error(
					"Received more than 10k records from etherscan, which means we need to paginate!",
				);
			}
			const ogTransactions = ogContractEvents.data.result.map((tx) => ({
				...tx,
				contractAddress: "0x015A06a433353f8db634dF4eDdF0C109882A15AB",
			}));

			const wrapperTransactions = wrapperContractEvents.data.result.map(
				(tx) => ({
					...tx,
					contractAddress: "0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b",
				}),
			);
			allTransactions.push(...ogTransactions);
			allTransactions.push(...wrapperTransactions);

			logger.log(
				"Scanning (inclusive) from: " +
					currentBlock +
					" to " +
					toBlock +
					".  Total transactions so far: " +
					allTransactions.length,
			);
			currentBlock = toBlock + 1;
		} catch (error) {
			logger.error(
				`Error fetching transactions for blocks ${currentBlock} to ${toBlock}`,
				error,
			);
			await sleep(5000); // Wait 5 seconds before retrying
			continue; // Skip to next iteration without updating currentBlock
		}

		await sleep(RATE_LIMIT_DELAY);
	}

	// Sort by blockNumber, and if tied, sort by transactionIndex
	return sortEvents(allTransactions);
}

async function makeRateLimitedRequest(url: string, config: any) {
	const MAX_RETRIES = 3;
	let retries = 0;

	while (retries < MAX_RETRIES) {
		try {
			const response = await axios.get(url, config);
			if (response.data.status === "1" && Array.isArray(response.data.result)) {
				return response;
			} else {
				throw new Error(
					response.data.message || "Invalid response from Etherscan",
				);
			}
		} catch (error) {
			retries++;
			if (retries >= MAX_RETRIES) {
				throw error;
			}
			await sleep(5000); // Wait 5 seconds before retrying
		}
	}
}

// Add this utility function in a separate file (e.g., sleep.ts)
export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
