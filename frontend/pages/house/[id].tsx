import React, { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import tileHouse from "../../public/assets/images/tileHouse.png";
import { fetchSingleTile } from "../../utils/api";

import Loader from "../../components/Loader";
import styles from "../../styles/pages/Home.module.scss";
import Image from "next/image";
import Header from "../../components/Header";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

const House = () => {
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
          <Image
            className="w-6/12 h-full"
            src={tileHouse}
            alt="Portal"
            width={600}
            height={600}
          />
        </div>
      </div>
    </>
  );
};

export default House;
