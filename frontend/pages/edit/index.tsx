import React, { useEffect, useState } from "react";

import Head from "next/head";
import { useWeb3React } from "@web3-react/core";
import { Contract } from "@ethersproject/contracts";

import { TileAsset } from "../../types/TileAsset";

import EditTile from "../../components/EditTile";
import ImageEditorModal from "../../components/ImageEditorModal";

import { fetchTiles } from "../../utils/api";
import { priceToEth, convertEthToWei } from "../../utils/misc";
import { compressTileCode } from "../../utils/ImageUtils";
import ContractABI from "../../abi/pixelabi.json";
import WrappedContractABI from "../../abi/wrapperpixelabi.json";

import {
  PIXELMAP_CONTRACT,
  WRAPPED_PIXELMAP_CONTRACT,
} from "../../constants/addresses";
import getConfig from "next/config";
import Layout from "../../components/Layout";

function Edit() {
  const [tiles, setTiles] = useState<TileAsset[]>([]);
  const [ownedTiles, setOwnedTiles] = useState<TileAsset[]>([]);
  const [isOpenImageEditor, setIsOpenImageEditor] = useState<boolean>(false);
  const [imageEditorTile, setImageEditorTile] = useState<TileAsset>({ id: 0 });
  const { publicRuntimeConfig } = getConfig();
  const { account, library } = useWeb3React();

  useEffect(() => {
    fetchTiles().then((_tiles) => {
      setTiles(_tiles);
    });
  }, []);

  useEffect(() => {
    if (account) {
      let owned = tiles.filter((tile: TileAsset) => {
        return tile.owner.toLowerCase() === account.toLowerCase();
      });

      owned = owned.map((tile: TileAsset) => {
        tile.newPrice = priceToEth(tile);
        return tile;
      });

      setOwnedTiles(owned);
    }
  }, [account, tiles]);

  const handlePriceChange = (price: string, index: number) => {
    let _tiles = ownedTiles;
    _tiles[index].newPrice = price
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*?)\..*/g, "$1");

    setOwnedTiles([..._tiles]);
  };

  const handleLinkChange = (link: string, index: number) => {
    let _tiles = ownedTiles;
    _tiles[index].url = link;

    setOwnedTiles([..._tiles]);
  };

  const handleImageChange = (image: string) => {
    let _tiles = ownedTiles;

    _tiles = _tiles.map((tile: TileAsset) => {
      if (tile.id === imageEditorTile.id) {
        tile.image = image;
      }

      return tile;
    });

    setOwnedTiles([..._tiles]);
  };

  const openImageEditor = (tile: TileAsset) => {
    setImageEditorTile(tile);
    setIsOpenImageEditor(true);
  };

  const handleSave = (tile: TileAsset) => {
    console.log(tile.image);
    let compressedImage = compressTileCode(tile.image);
    console.log(tile.image);
    if (tile.wrapped === true) {
      const contract = new Contract(
        WRAPPED_PIXELMAP_CONTRACT,
        WrappedContractABI,
        library.getSigner(account)
      );
      contract.setTileData(tile.id, compressedImage, tile.url);
    } else {
      const contract = new Contract(
        PIXELMAP_CONTRACT,
        ContractABI,
        library.getSigner(account)
      );
      contract.setTile(
        tile.id,
        compressedImage,
        tile.url,
        convertEthToWei(tile.newPrice)
      );
    }
  };

  return (
    <>
      <Head>
        <title>Edit Tiles | PixelMap.io</title>
      </Head>
      <Layout>
        <main className="w-full max-w-2xl mx-auto mt-12 sm:mt-24 min-h-80 px-3">
          <h1 className="text-3xl font-bold mb-4 text-white">
            Edit your tiles
          </h1>
          <div className="">
            {ownedTiles.map((ownedTile: TileAsset, index: number) => (
              <EditTile
                tile={ownedTile}
                index={index}
                handleImageEditor={openImageEditor}
                handleLinkChange={handleLinkChange}
                handlePriceChange={handlePriceChange}
                handleSave={handleSave}
                key={ownedTile.id}
              />
            ))}
          </div>

          <ImageEditorModal
            isOpen={isOpenImageEditor}
            setIsOpen={(val: boolean) => setIsOpenImageEditor(val)}
            tile={imageEditorTile}
            changeImage={handleImageChange}
          />
        </main>
      </Layout>
    </>
  );
}

export default Edit;
