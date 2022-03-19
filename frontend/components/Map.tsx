import React, { useState, useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import MapToggles from "./MapToggles";
import MapTiles from "./MapTiles";
import TileOverlay from "./TileOverlay";
import styles from "../styles/components/Map.module.scss";
import getConfig from "next/config";
import Image from "next/image";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

export default function Map(props: any) {
  const [showOwned, setShowOwned] = useState(false);
  const [showForSale, setShowForSale] = useState(false);
  const [ownedTiles, setOwnedTiles] = useState(false);
  const [forSaleTiles, setForSaleTiles] = useState(false);
  const { account } = useWeb3React();

  const toggleForSale = (value: boolean) => {
    setShowForSale(value);
    //setShowOwned( false );
  };

  const toggleOwnedTiles = (value: boolean) => {
    setShowOwned(value);
    //setShowForSale( false );
  };

  useEffect(() => {
    setOwnedTiles(
      props.tiles.filter((tile: PixelMapTile) => {
        return (
          account &&
          account != "" &&
          account.toLowerCase() === tile.owner.toLowerCase()
        );
      })
    );

    setForSaleTiles(
      props.tiles.filter((tile: PixelMapTile) => {
        return tile.openseaPrice && tile.openseaPrice != 0;
      })
    );
  }, [props.tiles, account]);

  return (
    <>
      <div className="max-w-map mx-auto px-3 flex justify-between">
        <MapToggles
          showOwned={showOwned}
          setShowOwned={toggleOwnedTiles}
          showForSale={showForSale}
          setShowForSale={toggleForSale}
        />

        {/* <ToggleTheme theme={theme} toggleTheme={toggleTheme} /> */}
      </div>

      <div
        className="overflow-auto p-2"
        style={{ touchAction: "manipulation" }}
      >
        <div className={`${styles.tileMap}`}>
          {showOwned && (
            <div className="absolute left-0 top-0 w-map h-map grid grid-cols-map grid-rows-map z-20 pointer-events-none ">
              <TileOverlay tiles={ownedTiles} bgColor="bg-blue-600" />
            </div>
          )}

          {showForSale && (
            <div className="absolute left-0 top-0 w-map h-map grid grid-cols-map grid-rows-map z-20 pointer-events-none ">
              <TileOverlay tiles={forSaleTiles} bgColor="bg-green-600" />
            </div>
          )}

          <div className="relative w-map h-map grid grid-cols-map grid-rows-map z-20">
            <MapTiles tiles={props.tiles} />
          </div>

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="absolute inset-0 z-10"
            src="https://pixelmap.art/tilemap.png"
            alt="PixelMap Map"
            height={"100%"}
            width={"100%"}
          />
        </div>
      </div>
    </>
  );
}
