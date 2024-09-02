import { ethers } from "ethers";
import * as pixelMapABI from "../../../abi/PixelMap.json";
import * as pixelMapWrapperABI from "../../../abi/PixelMapWrapper.json";

export function initializeEthersJS() {
	const provider = new ethers.JsonRpcProvider(process.env.WEB3_URL, "mainnet");
	provider.on("debug", (info) => {
		console.log(info.action);
	});
	const pixelMap = new ethers.Contract(
		"0x015a06a433353f8db634df4eddf0c109882a15ab",
		pixelMapABI,
		provider,
	);
	const pixelMapWrapper = new ethers.Contract(
		"0x050dc61dfb867e0fe3cf2948362b6c0f3faf790b",
		pixelMapWrapperABI,
		provider,
	);
	return { provider, pixelMap, pixelMapWrapper };
}
