import {
  AVERAGE_BLOCK_SECONDS,
  PROJECT256_CONTRACT,
  PROJECT256_LOCK_BLOCK,
  PROJECT256_LOCK_TIMESTAMP,
  PROJECT256_SELECTORS,
  PROJECT256_UNLOCK_BLOCK,
  PUBLIC_RPC_ENDPOINTS,
} from "../constants/project256";

export interface Project256Status {
  currentBlock: number;
  unlockBlock: number;
  framesMinted: number | null;
}

export interface CountdownParts {
  years: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const MS_PER_YEAR = 365 * MS_PER_DAY;

export function blocksRemaining(currentBlock: number, unlockBlock: number = PROJECT256_UNLOCK_BLOCK): number {
  return Math.max(0, unlockBlock - currentBlock);
}

/** Estimated unlock moment assuming 12-second blocks from `now`. */
export function estimateUnlockDate(
  currentBlock: number,
  now: Date = new Date(),
  unlockBlock: number = PROJECT256_UNLOCK_BLOCK,
): Date {
  const remaining = blocksRemaining(currentBlock, unlockBlock);
  return new Date(now.getTime() + remaining * AVERAGE_BLOCK_SECONDS * MS_PER_SECOND);
}

/**
 * Offline estimate anchored to the lockUntilBlock transaction itself.
 * Resolves to 2036-04-17T21:50:23Z, the date quoted in the original announcement.
 */
export function fallbackUnlockDate(): Date {
  return estimateUnlockDate(PROJECT256_LOCK_BLOCK, new Date(PROJECT256_LOCK_TIMESTAMP));
}

/** Splits a duration into whole years (365 days), days, hours, minutes and seconds. */
export function splitDuration(ms: number): CountdownParts {
  let rest = Math.max(0, Math.floor(ms));
  const years = Math.floor(rest / MS_PER_YEAR);
  rest -= years * MS_PER_YEAR;
  const days = Math.floor(rest / MS_PER_DAY);
  rest -= days * MS_PER_DAY;
  const hours = Math.floor(rest / MS_PER_HOUR);
  rest -= hours * MS_PER_HOUR;
  const minutes = Math.floor(rest / MS_PER_MINUTE);
  rest -= minutes * MS_PER_MINUTE;
  const seconds = Math.floor(rest / MS_PER_SECOND);
  return { years, days, hours, minutes, seconds };
}

/** Fraction of the lock that has elapsed, clamped to [0, 1]. */
export function lockProgress(currentBlock: number, unlockBlock: number = PROJECT256_UNLOCK_BLOCK): number {
  const span = unlockBlock - PROJECT256_LOCK_BLOCK;
  if (span <= 0) return 1;
  const elapsed = currentBlock - PROJECT256_LOCK_BLOCK;
  return Math.min(1, Math.max(0, elapsed / span));
}

export function formatBlock(block: number): string {
  return block.toLocaleString("en-US");
}

export function formatUtc(date: Date): string {
  const formatted = date.toLocaleString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${formatted} UTC`;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

interface RpcResult {
  id: number;
  result?: string;
  error?: { message?: string };
}

function parseHexQuantity(value: string | undefined): number | null {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]+$/.test(value)) return null;
  const parsed = Number.parseInt(value, 16);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/**
 * Reads the current block, the contract's live `unlockBlock`, and the frames minted so far.
 * Tries each public endpoint in turn and throws only when all of them fail.
 */
export async function fetchProject256Status(
  fetchImpl: FetchLike | undefined = typeof fetch === "function" ? fetch : undefined,
  endpoints: string[] = PUBLIC_RPC_ENDPOINTS,
): Promise<Project256Status> {
  if (!fetchImpl) throw new Error("fetch is not available");

  const batch = [
    { jsonrpc: "2.0", id: 1, method: "eth_blockNumber", params: [] },
    {
      jsonrpc: "2.0",
      id: 2,
      method: "eth_call",
      params: [{ to: PROJECT256_CONTRACT, data: PROJECT256_SELECTORS.unlockBlock }, "latest"],
    },
    {
      jsonrpc: "2.0",
      id: 3,
      method: "eth_call",
      params: [{ to: PROJECT256_CONTRACT, data: PROJECT256_SELECTORS.totalFramesMinted }, "latest"],
    },
  ];

  let lastError: unknown = new Error("No RPC endpoints configured");
  for (const endpoint of endpoints) {
    try {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(batch),
      });
      if (!response.ok) throw new Error(`RPC ${endpoint} responded ${response.status}`);
      const payload = (await response.json()) as RpcResult[] | RpcResult;
      const results = Array.isArray(payload) ? payload : [payload];
      const byId = new Map(results.map((entry) => [entry.id, entry]));

      const currentBlock = parseHexQuantity(byId.get(1)?.result);
      if (currentBlock === null) throw new Error(`RPC ${endpoint} returned no block number`);

      const unlockBlock = parseHexQuantity(byId.get(2)?.result) ?? PROJECT256_UNLOCK_BLOCK;
      const framesMinted = parseHexQuantity(byId.get(3)?.result);
      return { currentBlock, unlockBlock, framesMinted };
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
