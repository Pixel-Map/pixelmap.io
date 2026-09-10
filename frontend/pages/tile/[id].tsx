import useAssetData from "../../hooks/useAssetData";
import AssetStatus from "../../components/AssetStatus";
import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import { fetchSingleTile } from "../../utils/api";

import Loader from "../../components/Loader";
import TileCard from "../../components/TileCard";
import TileHistory from "../../components/TileHistory";
import Layout from "../../components/Layout";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

const Tile = () => {
  const router = useRouter();
  const id = router.query.id as string;

  const { data: tile, setData: setTile, loading: fetching, error: assetError, retry: retryAssets } = useAssetData<PixelMapTile | undefined>(id, fetchSingleTile, undefined);

  if (assetError) return <Layout><AssetStatus error={assetError} retry={retryAssets} /></Layout>;

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
              <div className="text-center my-6">
                <Link href={`/paint/${tile.id}`} className="nes-btn is-primary">Paint this tile in Mario Paint</Link>
              </div>
              <div className="w-full max-w-6xl mx-auto my-6 lg:my-8">
                <TileHistory 
                  tile={tile} 
                  historicalImages={tile.historical_images}
                />
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
