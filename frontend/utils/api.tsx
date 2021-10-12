import { TileAsset } from '../types/TileAsset';
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();

export const fetchTiles = async () => {
  try {
    const res = await fetch(`${publicRuntimeConfig.NEXT_PUBLIC_API_ENDPOINT}/tiledata`);
    const tiles:Array<TileAsset> = await res.json();

    // By returning { props: { posts } }, the Blog component
    // will receive `posts` as a prop at build time
    return tiles;
  } catch( err ) {
    return [];
  }
}


export const fetchSingleTile = async (id: string) => {
  let tile: TileAsset;

  try {
    const res = await fetch(`${publicRuntimeConfig.NEXT_PUBLIC_API_ENDPOINT}/tile/${id}`);
    tile = await res.json();

  } catch( err ) {
  
  }

  return tile;
}