import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";

import { fetchSingleTile } from "../../utils/api";

import Loader from "../../components/Loader";
import TileCard from "../../components/TileCard";
import Layout from "../../components/Layout";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

const Tile = () => {
  const [tile, setTile] = useState<PixelMapTile>();
  const [fetching, setFetching] = useState(false);
  const router = useRouter();
  const id = router.query.id as string;

  useEffect(() => {
    setFetching(true);

    fetchSingleTile(id).then((_tile) => {
      setTile(_tile);
      setFetching(false);
    });
  }, [, id]);

  return (
    <>
      {!tile && (
        <>
          <Head>
            <title>Tile - PixelMap.io</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>
        </>
      )}

      {fetching && (
        <div className="flex items-center justify-center min-h-80">
          <Loader />
        </div>
      )}

      {tile && !fetching && (
        <>
          <Head>
            <title>Tile #{tile.id} - PixelMap.io</title>
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <Layout>
            <div className="min-h-80">
              <div className="w-full max-w-2xl mx-auto nes-container bg-white p-0 relative my-6 lg:my-16">
                <TileCard tile={tile} large />
              </div>
            </div>
          </Layout>
        </>
      )}
    </>
  );
};

export async function getStaticPaths() {
  const paths: { params: { id: string } }[] = [];
  for (let i = 0; i < 3970; i++) {
    paths.push({ params: { id: i.toString() } });
  }
  return {
    paths: paths,
    fallback: false, // can also be true or 'blocking'
  };
}

export async function getStaticProps(context: { params: { id: string } }) {
  return {
    // Passed to the page component as props
    props: { post: {} },
  };
}

export default Tile;
