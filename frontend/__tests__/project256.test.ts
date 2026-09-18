import {
  blocksRemaining,
  estimateUnlockDate,
  fallbackUnlockDate,
  fetchProject256Status,
  formatBlock,
  formatUtc,
  lockProgress,
  splitDuration,
} from "../utils/project256";
import {
  PROJECT256_CONTRACT,
  PROJECT256_LOCK_BLOCK,
  PROJECT256_SELECTORS,
  PROJECT256_UNLOCK_BLOCK,
} from "../constants/project256";

describe("project256 utils", () => {
  describe("blocksRemaining", () => {
    it("counts blocks until the unlock block", () => {
      expect(blocksRemaining(51_199_000)).toBe(1_000);
    });

    it("never goes negative once the unlock block has passed", () => {
      expect(blocksRemaining(51_200_001)).toBe(0);
    });
  });

  describe("estimateUnlockDate", () => {
    it("adds 12 seconds per remaining block", () => {
      const now = new Date("2030-01-01T00:00:00Z");
      const estimate = estimateUnlockDate(PROJECT256_UNLOCK_BLOCK - 10, now);
      expect(estimate.toISOString()).toBe("2030-01-01T00:02:00.000Z");
    });

    it("returns now when the lock has expired", () => {
      const now = new Date("2040-01-01T00:00:00Z");
      expect(estimateUnlockDate(PROJECT256_UNLOCK_BLOCK + 5, now).getTime()).toBe(now.getTime());
    });
  });

  describe("fallbackUnlockDate", () => {
    it("matches the date quoted in the lock announcement", () => {
      expect(fallbackUnlockDate().toISOString()).toBe("2036-04-17T21:50:23.000Z");
    });
  });

  describe("splitDuration", () => {
    it("splits a duration into years, days, hours, minutes and seconds", () => {
      const ms = ((((2 * 365 + 3) * 24 + 4) * 60 + 5) * 60 + 6) * 1000;
      expect(splitDuration(ms)).toEqual({ years: 2, days: 3, hours: 4, minutes: 5, seconds: 6 });
    });

    it("clamps negative durations to zero", () => {
      expect(splitDuration(-5000)).toEqual({ years: 0, days: 0, hours: 0, minutes: 0, seconds: 0 });
    });
  });

  describe("lockProgress", () => {
    it("is zero at the lock block", () => {
      expect(lockProgress(PROJECT256_LOCK_BLOCK)).toBe(0);
    });

    it("is halfway at the midpoint", () => {
      const mid = PROJECT256_LOCK_BLOCK + (PROJECT256_UNLOCK_BLOCK - PROJECT256_LOCK_BLOCK) / 2;
      expect(lockProgress(mid)).toBeCloseTo(0.5, 6);
    });

    it("clamps to [0, 1]", () => {
      expect(lockProgress(PROJECT256_LOCK_BLOCK - 1000)).toBe(0);
      expect(lockProgress(PROJECT256_UNLOCK_BLOCK + 1000)).toBe(1);
    });
  });

  describe("formatters", () => {
    it("formats block numbers with thousands separators", () => {
      expect(formatBlock(51_200_000)).toBe("51,200,000");
    });

    it("formats dates in UTC", () => {
      expect(formatUtc(new Date("2036-04-17T21:50:23Z"))).toBe("April 17, 2036 at 9:50:23 PM UTC");
    });
  });

  describe("fetchProject256Status", () => {
    const okResponse = (results: unknown) =>
      ({ ok: true, status: 200, json: async () => results } as unknown as Response);

    it("reads the block number, unlock block and frames minted from a batch response", async () => {
      const fetchMock = jest.fn().mockResolvedValue(
        okResponse([
          { jsonrpc: "2.0", id: 1, result: "0x18cd3ce" },
          { jsonrpc: "2.0", id: 2, result: "0x00000000000000000000000000000000000000000000000000000000030d4000" },
          { jsonrpc: "2.0", id: 3, result: "0x0000000000000000000000000000000000000000000000000000000000000022" },
        ]),
      );

      const status = await fetchProject256Status(fetchMock, ["https://rpc.example"]);
      expect(status).toEqual({ currentBlock: 26_006_478, unlockBlock: 51_200_000, framesMinted: 34 });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://rpc.example");
      const body = JSON.parse(init.body);
      expect(body[0].method).toBe("eth_blockNumber");
      expect(body[1].params[0]).toEqual({ to: PROJECT256_CONTRACT, data: PROJECT256_SELECTORS.unlockBlock });
      expect(body[2].params[0]).toEqual({ to: PROJECT256_CONTRACT, data: PROJECT256_SELECTORS.totalFramesMinted });
    });

    it("falls back to the constant unlock block when the contract read fails", async () => {
      const fetchMock = jest.fn().mockResolvedValue(
        okResponse([
          { jsonrpc: "2.0", id: 1, result: "0x18cd3ce" },
          { jsonrpc: "2.0", id: 2, error: { message: "execution reverted" } },
          { jsonrpc: "2.0", id: 3, error: { message: "execution reverted" } },
        ]),
      );

      const status = await fetchProject256Status(fetchMock, ["https://rpc.example"]);
      expect(status).toEqual({ currentBlock: 26_006_478, unlockBlock: PROJECT256_UNLOCK_BLOCK, framesMinted: null });
    });

    it("tries the next endpoint when the first one fails", async () => {
      const fetchMock = jest
        .fn()
        .mockRejectedValueOnce(new Error("network down"))
        .mockResolvedValueOnce(okResponse([{ jsonrpc: "2.0", id: 1, result: "0x10" }]));

      const status = await fetchProject256Status(fetchMock, ["https://a.example", "https://b.example"]);
      expect(status.currentBlock).toBe(16);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1][0]).toBe("https://b.example");
    });

    it("throws when every endpoint fails", async () => {
      const fetchMock = jest.fn().mockResolvedValue({ ok: false, status: 503 } as Response);
      await expect(fetchProject256Status(fetchMock, ["https://a.example", "https://b.example"])).rejects.toThrow(
        "responded 503",
      );
    });

    it("throws when fetch is unavailable", async () => {
      await expect(fetchProject256Status(undefined, ["https://a.example"])).rejects.toThrow("fetch is not available");
    });
  });
});
