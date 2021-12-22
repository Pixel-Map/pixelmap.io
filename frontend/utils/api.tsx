import { TileAsset } from "../types/TileAsset";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

export const fetchTiles = async () => {
  try {
    const res = await fetch("https://pixelmap.art/tiledata.json");
    const tiles: Array<TileAsset> = await res.json();

    // By returning { props: { posts } }, the Blog component
    // will receive `posts` as a prop at build time
    return tiles;
  } catch (err) {
    return [];
  }
};

export const fetchSingleTile = async (id: string) => {
  let tile: TileAsset;

  try {
    const res = await fetch(`https://pixelmap.art/tile/${id}`);
    tile = await res.json();
  } catch (err) {}

  return tile;
};

export interface TimeCapsuleTile {
  tileId?: number,
  orderImageSetOnTile?: number,
  currentOwner?: number,
}

export const fetchTimeCapsuleTiles = async () => {
  try {
    const res = await fetch("https://pixelmap.art/timecapsuleI.json");
    const tiles: Array<TimeCapsuleTile> = await res.json();

    // By returning { props: { posts } }, the Blog component
    // will receive `posts` as a prop at build time
    return tiles;
  } catch (err) {
    return [];
  }
};