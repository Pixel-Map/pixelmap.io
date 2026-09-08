import useAssetData from "../../hooks/useAssetData";
import AssetStatus from "../../components/AssetStatus";
import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { fetchSingleTile } from "../../utils/api";

import Loader from "../../components/Loader";
import styles from "../../styles/pages/Home.module.scss";
import tileHouseStyle from "../../styles/pages/TileHouse.module.scss";
import Header from "../../components/Header";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

const House = () => {
  const canvasRef = useRef(null);

  const router = useRouter();
  const id = router.query.id as string;

  const { data: tile, setData: setTile, loading: fetching, error: assetError, retry: retryAssets } = useAssetData<PixelMapTile | undefined>(id, fetchSingleTile, undefined);
  useEffect(() => { const previous = document.body.style.overflow; document.body.style.overflow = "hidden"; return () => { document.body.style.overflow = previous; }; }, []);

  if (assetError) return <AssetStatus error={assetError} retry={retryAssets} />;

  return (
    <>
      <div className={styles.tileHouse}>
        <Header />
      </div>

      <div
        className={`flex items-center justify-center h-screen
      ${styles.tileHouse}`}
      >
        {!tile && (
          <>
            <Head>
              <title>Tile - PixelMap.io</title>
              <link rel="icon" href="/favicon.ico" />
            </Head>
          </>
        )}

        {fetching && (
          <div className="w-screen flex flex-wrap flex-row place-items-center ">
            <Loader />
          </div>
        )}

        {tile && !fetching && (
          <>
            <Head>
              <title>Tile House #{tile.id} - PixelMap.io</title>
              <link rel="icon" href="/favicon.ico" />
            </Head>
          </>
        )}
        <div className="place-content-center ">
          <p>
            <iframe
              src="https://homestead-adventure.com/"
              width="1280"
              height="720"
            ></iframe>
          </p>
        </div>
      </div>
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

export default House;
