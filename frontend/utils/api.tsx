import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

const assetBase = (process.env.NEXT_PUBLIC_ASSET_BASE_URL || "https://pixelmap.art").replace(/\/$/, "");

async function fetchJSON(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${assetBase}/${path}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`Unable to load tile data (HTTP ${response.status}).`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchArray<T>(path: string): Promise<T[]> {
  const data = await fetchJSON(path);
  if (!Array.isArray(data)) throw new Error("Tile data has an unexpected format.");
  return data as T[];
}

export const fetchTiles = (): Promise<PixelMapTile[]> => fetchArray("tiledata.json");

export const fetchSingleTile = async (id: string | undefined): Promise<PixelMapTile | undefined> => {
  if (id === undefined) return undefined;
  if (!/^\d+$/.test(id) || Number(id) >= 3970) throw new Error("Invalid tile number.");
  const data = await fetchJSON(`tile/${id}.json`);
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error("Tile data has an unexpected format.");
  return { ...data, id: Number(id) };
};

export interface TimeCapsuleTile {
  tileId?: number;
  orderImageSetOnTile?: number;
  currentOwner?: number;
  claimed?: boolean;
}

export const fetchTimeCapsuleTiles = (): Promise<TimeCapsuleTile[]> => fetchArray("timecapsuleI.json");
export const fetchAllTilesEver = (): Promise<TimeCapsuleTile[]> => fetchArray("allimages.json");
