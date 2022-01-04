import React, { useState } from "react";

import TilePopover from "./TilePopover";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

function MapTiles({ tiles }) {
  let [currentTile, setCurrentTile] = useState<PixelMapTile | null>();
  let [tileElement, setTileElement] = useState<HTMLButtonElement | null>();

  const handleClick = (tileIndex: number, ref: HTMLButtonElement) => {
    setCurrentTile(tiles[tileIndex]);
    setTileElement(ref);
  };

  return (
    <>
      {tiles.map((tile: PixelMapTile, idx: number) => (
        <button
          key={idx}
          onClick={(e) => {
            handleClick(idx, e.currentTarget);
          }}
          className="block nes-pointer w-4 h-4 ring-green-600 hover:ring hover:bg-green-500 hover:bg-opacity-40 hover:ring-opacity-100"
        ></button>
      ))}

      <TilePopover tile={currentTile} referenceElement={tileElement} />
    </>
  );
}

export default React.memo(MapTiles);
