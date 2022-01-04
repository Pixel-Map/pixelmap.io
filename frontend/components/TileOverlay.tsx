import React from "react";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

function TileOverlay({ tiles, bgColor }) {
  return (
    <>
      {tiles.map((tile: PixelMapTile, idx: number) => {
        let y = Math.floor(tile.id / 81) + 1;
        let x = tile.id + 1 - (y - 1) * 81;

        return (
          <div
            key={idx}
            className={`relative w-4 h-4 ${bgColor} bg-opacity-80`}
            style={{
              gridColumnStart: `${x}`,
              gridColumnEnd: `auto`,
              gridRowStart: `${y}`,
              gridRowEnd: `auto`,
            }}
          ></div>
        );
      })}
    </>
  );
}

export default React.memo(TileOverlay);
