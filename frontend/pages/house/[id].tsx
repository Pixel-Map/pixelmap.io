import React, { useEffect, useState } from 'react';
import Head from 'next/head'
import { useRouter } from 'next/router'

import { fetchSingleTile } from '../../utils/api';

import { TileAsset } from '../../types/TileAsset';
import Loader from '../../components/Loader';

const House = () => {
  const [tile, setTile] = useState<TileAsset>();
  const [fetching, setFetching] = useState(false);
  const router = useRouter()
  const id = router.query.id as string;

  useEffect( () => {
    setFetching(true);

    fetchSingleTile(id).then( (_tile) => {
      setTile(_tile);
      setFetching(false);
    });
  }, [, id]);

  return (
    <>
      { !tile &&
      <>
        <Head>
          <title>Tile - PixelMap.io</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
      </>
      }

      { fetching &&
      <div className="flex items-center justify-center min-h-80">
        <Loader />
      </div>
      }

      { tile && !fetching &&
      <>
        <Head>
          <title>Tile House #{tile.id} - PixelMap.io</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>
      </>
      }
    </>

  );
}

export default House
