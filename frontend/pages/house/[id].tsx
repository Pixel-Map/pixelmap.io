import React, { useEffect, useRef, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { fetchSingleTile } from "../../utils/api";

import Loader from "../../components/Loader";
import styles from "../../styles/pages/Home.module.scss";
import tileHouseStyle from "../../styles/pages/TileHouse.module.scss";
import Header from "../../components/Header";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";
import Overworld from "../../lib/overworld";

const House = () => {
  const canvasRef = useRef(null);

  const [tile, setTile] = useState<PixelMapTile>();
  const [fetching, setFetching] = useState(false);
  const router = useRouter();
  const id = router.query.id as string;

  useEffect(() => {
    const overworld = new Overworld(canvasRef);
    overworld.init();
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
          <div className={tileHouseStyle.gameContainer}>
            <canvas
              className="game-canvas"
              width="756"
              height="790"
              ref={canvasRef}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default House;
