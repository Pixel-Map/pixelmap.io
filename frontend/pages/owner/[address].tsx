import React, { useEffect, useState } from 'react';
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { fetchTiles } from '../../utils/api';

import { TileAsset } from '../../types/TileAsset';
import Loader from '../../components/Loader';

import TileImage from '../../components/TileImage';
import { shortenIfHex, formatPrice } from "../../utils/misc";
import Layout from "../../components/Layout";

const Owner = () => {
  const router = useRouter()

  const [tiles, setTiles] = useState<TileAsset[]>([]);
  const [ownedTiles, setOwnedTiles] = useState<TileAsset[]>([]);
  const [fetching, setFetching] = useState(false);
  
  const address = router.query.address as string;

  useEffect( () => {
    setFetching(true);

    fetchTiles().then( (_tiles) => {
      setTiles(_tiles);
      setFetching(false);
    });
  }, []);

  useEffect( () => {
    if( address ) {
      let owned = tiles.filter( (tile: TileAsset) => {
        return tile.owner.toLowerCase() === address.toLowerCase();
      });

      setOwnedTiles(owned);
    }
    
  }, [address, tiles] );


  return (
    <>
      <Head>
        <title>Owner Tiles - PixelMap.io</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Layout>
      { fetching &&
        <div className="flex items-center justify-center min-h-80">
          <Loader />
        </div>
      }

      { tiles && !fetching &&
        <main className="w-full max-w-7xl mx-auto mt-12 sm:mt-24 min-h-80 px-3">
          <h1 className="text-3xl font-bold mb-4 text-white">{shortenIfHex(address || '')} Tiles</h1>
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
          { ownedTiles.map( (ownedTile: TileAsset, index: number) => (
            <Link href={`/tile/${ownedTile.id}`} key={index} passHref={true}>
              <button className={`flex flex-col items-center py-3 px-4 bg-white w-full text-left font-medium nes-container nes-pointer`}>
                <div className="bg-gray-200 aspect-w-1 aspect-h-1 w-full h-full	mb-3">
                  <TileImage image={ownedTile.image} className="h-full w-full" />
                </div>

                <span className="font-bold">Tile #{ownedTile.id}</span>
              </button>
            </Link>
          ))}
          </div>
        </main>
        }
      </Layout>
    </>
            
  );
}

export default Owner 
