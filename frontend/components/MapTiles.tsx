import React, { useState } from "react";

import TilePopover from "./TilePopover";
import Project256Vault from "./Project256Vault";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";
import { PROJECT256_TILE_ID } from "../constants/project256";

const TILE_CLASSES =
  "block nes-pointer w-4 h-4 ring-green-600 hover:ring hover:bg-green-500 hover:bg-opacity-40 hover:ring-opacity-100";

function MapTiles({ tiles }) {
  let [currentTile, setCurrentTile] = useState<PixelMapTile | null>();
  let [tileElement, setTileElement] = useState<HTMLButtonElement | null>();
  const [vaultOpen, setVaultOpen] = useState(false);

  const tileId = (tile: PixelMapTile, idx: number): number => (tile?.id ?? idx);

  const handleClick = (tileIndex: number, ref: HTMLButtonElement) => {
    const tile = tiles[tileIndex];
    if (tileId(tile, tileIndex) === PROJECT256_TILE_ID) {
      setVaultOpen(true);
      return;
    }
    setCurrentTile(tile);
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
          className={TILE_CLASSES}
        ></button>
      ))}

      <TilePopover tile={currentTile} referenceElement={tileElement} />
      <Project256Vault isOpen={vaultOpen} onClose={() => setVaultOpen(false)} />
    </>
  );
}

export default React.memo(MapTiles);
