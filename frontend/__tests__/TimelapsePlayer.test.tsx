import { buildTimeline } from "../components/TimelapsePlayer";

jest.mock("../utils/ImageUtils", () => ({
  decompressTileCode: (value: string) => value,
}));

class TestImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;

  constructor(data: Uint8ClampedArray, width: number, height: number) {
    this.data = data;
    this.width = width;
    this.height = height;
  }
}

describe("PixelMap timelapse reconstruction", () => {
  beforeAll(() => {
    Object.defineProperty(global, "ImageData", {
      configurable: true,
      value: TestImageData,
    });
  });

  it("keeps only visible pixel changes and reconstructs the opening frame", () => {
    const width = 81 * 16;
    const height = 49 * 16;
    const source = new ImageData(new Uint8ClampedArray(width * height * 4), width, height);
    const red = "f00".repeat(256);
    const blue = "00f".repeat(256);
    const green = "0f0".repeat(256);

    const timeline = buildTimeline(source, [
      {
        id: 0,
        wrapping_history: [
          {
            timestamp: "2021-10-01T00:00:00Z",
            block_number: 6,
            tx: "0xwrap",
            wrapped: true,
            updated_by: "0xowner",
          },
        ],
        historical_images: [
          { blockNumber: 1, date: "2020-01-01T00:00:00Z", image: red },
          { blockNumber: 2, date: "2021-09-01T00:00:00Z", image: red },
          { blockNumber: 3, date: "2022-03-01T00:00:00Z", image: blue },
          { blockNumber: 4, date: "2025-04-01T00:00:00Z", image: blue },
        ],
      },
      {
        id: 1,
        wrapping_history: [
          {
            timestamp: "2023-01-01T00:00:00Z",
            block_number: 7,
            tx: "0xunwrap",
            wrapped: false,
            updated_by: "0xowner",
          },
        ],
        historical_images: [
          { blockNumber: 5, date: "2021-08-22T23:31:48Z", image: green },
        ],
      },
    ]);

    expect(timeline.events).toHaveLength(4);
    expect(timeline.events.map((event) => event.blockNumber)).toEqual([5, 6, 3, 7]);
    expect(timeline.events.map((event) => event.kind)).toEqual([
      "image",
      "wrap",
      "image",
      "unwrap",
    ]);
    expect(timeline.yearlyCounts).toEqual({ 2021: 2, 2022: 1, 2023: 1 });
    expect(timeline.changedTileCount).toBe(2);
    expect(Array.from(timeline.baseFrame.data.slice(0, 4))).toEqual([255, 0, 0, 255]);
  });
});
