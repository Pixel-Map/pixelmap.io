/**
 * Project256 — the on-chain time lock holding PixelMap tile #2400.
 *
 * Every value here was read from Ethereum mainnet (see docs/project256-tile-2400-lock.md
 * for the verification commands). The tile is owned by the verified Project256 contract,
 * whose only release path (`unwrap`) requires `block.number >= unlockBlock`.
 */

export const PROJECT256_TILE_ID = 2400;

/** Verified Project256 ERC-721 contract (symbol "256"), the current owner of tile 2400. */
export const PROJECT256_CONTRACT = "0x67C9E1163EB2ea91CBE2C4907aCEf635Af9F0C5b";

/** zacks.eth — deployer and owner of Project256. */
export const PROJECT256_OWNER = "0x1B086Af7E34b3Fd9E989e732A171adcD0Fc32694";
export const PROJECT256_OWNER_ENS = "zacks.eth";

/** `unlockBlock` as set by `lockUntilBlock(51200000)`. */
export const PROJECT256_UNLOCK_BLOCK = 51_200_000;

/** Block and timestamp of the `lockUntilBlock` transaction, used for offline estimates. */
export const PROJECT256_LOCK_BLOCK = 26_003_066;
export const PROJECT256_LOCK_TIMESTAMP = "2026-09-18T08:03:35Z";

/** Post-merge Ethereum slot time. Used to turn "blocks remaining" into a date. */
export const AVERAGE_BLOCK_SECONDS = 12;

export interface Project256ProofEntry {
  label: string;
  detail: string;
  tx: string;
  block: number;
  timestamp: string;
}

/** The on-chain paper trail, oldest first. */
export const PROJECT256_PROOF: Project256ProofEntry[] = [
  {
    label: "Project256 deployed",
    detail: "zacks.eth deploys the Project256 contract with targetTile hard-coded to 2400.",
    tx: "0xd7b562ed37575a6488a6326aa7cb2105d09f3208d0d7ad04079a3f01e5e76a8f",
    block: 25_590_792,
    timestamp: "2026-07-22T20:55:59Z",
  },
  {
    label: "Tile listed for 0.1 ETH",
    detail: 'setTile(2400, " ", "Project256", 0.1 ETH) on the 2016 PixelMap contract.',
    tx: "0x779978f573fced9732243859471aae8778975b2342d7d81ee422280f71b8bbac",
    block: 25_590_841,
    timestamp: "2026-07-22T21:05:59Z",
  },
  {
    label: "Contract buys the tile",
    detail: "Project256.wrap() calls buyTile(2400); the contract becomes the on-chain owner.",
    tx: "0x7c9adafd8e00604cc0d877071fe5d9b3f0d3eca10654d669220239eff8deab18",
    block: 25_590_855,
    timestamp: "2026-07-22T21:08:47Z",
  },
  {
    label: "First time lock",
    detail: "lockPeriod(256256) sets unlockBlock to 25,847,287.",
    tx: "0x0f3f49d325098eb835dd8c4f814e21f3a13017b5b8ba8d39930d724cbabd4cc6",
    block: 25_591_031,
    timestamp: "2026-07-22T21:44:23Z",
  },
  {
    label: "Locked until block 51,200,000",
    detail: "lockUntilBlock(51200000) emits TimeLockStarted(51200000).",
    tx: "0x850b99d73b9cf854d8685373fa80c1b3a0169c46bdcb1252389d6440b6b49ed6",
    block: PROJECT256_LOCK_BLOCK,
    timestamp: PROJECT256_LOCK_TIMESTAMP,
  },
];

/** The lines of Solidity that make the lock real. Quoted from the verified source. */
export const PROJECT256_SOLIDITY_EXCERPT = `function unwrap(string calldata _returnUrl, uint256 _price) external onlyOwner {
    require(block.number >= unlockBlock, "Operations are currently timelocked");
    _pixelmap.setTile(targetTile, "", _returnUrl, _price);
}`;

/** Public JSON-RPC endpoints that allow browser requests, tried in order. */
export const PUBLIC_RPC_ENDPOINTS = [
  "https://ethereum-rpc.publicnode.com",
  "https://cloudflare-eth.com",
];

/** keccak256 selectors for the Project256 view functions we read live. */
export const PROJECT256_SELECTORS = {
  unlockBlock: "0xea35df16",
  totalFramesMinted: "0x4fdc6417",
};

export const etherscanTxUrl = (hash: string): string => `https://etherscan.io/tx/${hash}`;
export const etherscanAddressUrl = (address: string): string => `https://etherscan.io/address/${address}`;
