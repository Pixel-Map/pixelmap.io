import Head from 'next/head'

import Map from '../components/Map';
import { fetchTiles } from '../utils/api';
import Layout from "../components/Layout";
import {useEffect, useState} from "react";
import {PixelMapTile} from "@pixelmap/common/types/PixelMapTile";

function Home() {
  const [tiles, setTiles] = useState<PixelMapTile[]>([]);
  useEffect(() => {
    fetchTiles().then((_tiles) => {
      setTiles(_tiles);
    });
  }, []);

  return (
    <>
      <Layout>
        <Head>
          <title>PixelMap.io: Own a piece of Blockchain History!</title>
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className="py-8 md:py-12 lg:py-16">
          {tiles && <Map tiles={tiles} />}
        </main>
      </Layout>
    </>
  )
}

export default Home;
