import useAssetData from "../../hooks/useAssetData";
import AssetStatus from "../../components/AssetStatus";
import React, { useEffect, useState } from "react";

import Head from "next/head";
import { useWeb3React } from "@web3-react/core";
import { Contract } from "ethers";

import EditTile from "../../components/EditTile";
import ImageEditorModal from "../../components/ImageEditorModal";

import { fetchTiles } from "../../utils/api";
import { convertEthToWei } from "../../utils/misc";
import { compressTileCode } from "../../utils/ImageUtils";
import ContractABI from "../../abi/pixelabi.json";
import WrappedContractABI from "../../abi/wrapperpixelabi.json";

import {
  PIXELMAP_CONTRACT,
  WRAPPED_PIXELMAP_CONTRACT,
} from "../../constants/addresses";
import getConfig from "next/config";
import Layout from "../../components/Layout";
import { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

function Edit() {
  const [ownedTiles, setOwnedTiles] = useState<PixelMapTile[]>([]);
  const [saveError, setSaveError] = useState('');
  const [isOpenImageEditor, setIsOpenImageEditor] = useState<boolean>(false);
  const [imageEditorTile, setImageEditorTile] = useState<PixelMapTile>({
    id: 0,
  });

  const { account, library } = useWeb3React();

  const { data: tiles, setData: setTiles, loading: assetLoading, error: assetError, retry: retryAssets } = useAssetData<PixelMapTile[]>("tiles", fetchTiles, []);

  useEffect(() => {
    if (account) {
      let owned = tiles.filter((tile: PixelMapTile) => {
        return tile.owner && account && tile.owner.toLowerCase() === account.toLowerCase();
      });

      owned = owned.map((tile: PixelMapTile) => {
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

    _tiles = _tiles.map((tile: PixelMapTile) => {
      if (tile.id === imageEditorTile.id) {
        tile.image = image;
      }

      return tile;
    });

    setOwnedTiles([..._tiles]);
  };

  const openImageEditor = (tile: PixelMapTile) => {
    setImageEditorTile(tile);
    setIsOpenImageEditor(true);
  };

  const handleSave = async (tile: PixelMapTile) => {
    if (!tile.image) return;
    setSaveError('');
    try {
      let compressedImage = compressTileCode(tile.image);
      if (tile.wrapped === true) {
        if (!library || !account) return;
      
        const contract = new Contract(
          WRAPPED_PIXELMAP_CONTRACT,
          WrappedContractABI,
          await library.getSigner(account)
        );
        await contract.setTileData(tile.id, compressedImage, tile.url);
      } else {
        if (!library || !account) return;
      
        const contract = new Contract(
          PIXELMAP_CONTRACT,
          ContractABI,
          await library.getSigner(account)
        );
        await contract.setTile(
          tile.id,
          compressedImage,
          tile.url,
          convertEthToWei(tile.newPrice)
        );
      }
    } catch {
      setSaveError('Could not save the tile. Please check your wallet and try again.');
    }
  };

  if (assetError) return <Layout><AssetStatus error={assetError} retry={retryAssets} /></Layout>;

  return (
    <>
      <AssetStatus loading={assetLoading} error={assetError} retry={retryAssets} />
      <Head>
        <title>Edit Tiles | PixelMap.io</title>
      </Head>
      <Layout>
        <main className="w-full max-w-2xl mx-auto mt-12 sm:mt-24 min-h-80 px-3">
          <h1 className="text-3xl font-bold mb-4 text-white ">
            Edit your tiles
          </h1>
          {saveError && <p role="alert" className="nes-text is-error mb-4">{saveError}</p>}
          <div className="">
            {ownedTiles.map((ownedTile: PixelMapTile, index: number) => (
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
