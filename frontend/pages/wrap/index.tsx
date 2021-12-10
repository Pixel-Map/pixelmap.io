import React, { useEffect, useState } from "react";

import Head from "next/head";
import { useWeb3React } from "@web3-react/core";
import { Contract } from "@ethersproject/contracts";

import { TileAsset } from "../../types/TileAsset";

import WrapTile from "../../components/WrapTile";

import Account from "../../components/Account";
import useEagerConnect from "../../hooks/useEagerConnect";
import { fetchTiles } from "../../utils/api";
import { convertEthToWei } from "../../utils/misc";
import ContractABI from "../../abi/pixelabi.json";
import WrappedContractABI from "../../abi/wrapperpixelabi.json";

import {
  PIXELMAP_CONTRACT,
  WRAPPED_PIXELMAP_CONTRACT,
} from "../../constants/addresses";
import Layout from "../../components/Layout";

function Wrap() {
  const [tiles, setTiles] = useState<TileAsset[]>([]);
  const [ownedTiles, setOwnedTiles] = useState<TileAsset[]>([]);

  const { account, library } = useWeb3React();

  const triedToEagerConnect = useEagerConnect();

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

  const handleSave = async (tile: TileAsset, index: number) => {
    setTileErrorMessage(tile, index, "");

    try {
      const contract = new Contract(
        PIXELMAP_CONTRACT,
        ContractABI,
        library.getSigner(account)
      );
      contract.setTile(
        tile.id,
        tile.image,
        tile.url,
        convertEthToWei(tile.newPrice)
      );
    } catch (error) {
      setTileErrorMessage(tile, index, error.code);
    }
  };

  const handleWrap = async (tile: TileAsset, index: number) => {
    setTileErrorMessage(tile, index, "");

    try {
      const contract = new Contract(
        WRAPPED_PIXELMAP_CONTRACT,
        WrappedContractABI,
        library.getSigner(account)
      );
      await contract.wrap(tile.id, { value: tile.price });
    } catch (error) {
      setTileErrorMessage(tile, index, error.code);
    }
  };

  const handleRefresh = async (tile: TileAsset, index: number) => {
    setTileErrorMessage(tile, index, "");
    let _tiles = ownedTiles;

    try {
      const contract = new Contract(
        PIXELMAP_CONTRACT,
        ContractABI,
        library.getSigner(account)
      );
      let result = await contract.tiles(tile.id);

      let price = result["price"];
      let owner = result["owner"];

      if (owner == WRAPPED_PIXELMAP_CONTRACT) {
        _tiles[index].owner = owner;
        _tiles[index].wrapped = true;
      }

      _tiles[index].price = price.toString();

      setOwnedTiles([..._tiles]);
    } catch (error) {
      setTileErrorMessage(tile, index, error.code);
    }
  };

  const setTileErrorMessage = (
    tile: TileAsset,
    index: number,
    error: string
  ) => {
    let _tiles = ownedTiles;
    switch (error) {
      case "INSUFFICIENT_FUNDS":
        _tiles[index].errorMessage =
          "You have insufficient funds in your wallet. Please check your balance and try again.";
        break;
      case "":
        _tiles[index].errorMessage = "";
        break;
      default:
        _tiles[index].errorMessage =
          "Something went wrong, please try again or get help in the Discord.";
    }
    setOwnedTiles([..._tiles]);
  };

  return (
    <>
      <Head>
        <title>Wrap Tiles | PixelMap.io</title>
      </Head>

      <Layout>
        <main className="w-full max-w-2xl mx-auto mt-12 sm:mt-24 min-h-80 px-3">
          <h1 className="text-3xl font-bold mb-4 text-white">
            Wrap your tiles
          </h1>

          <div className="nes-container is-dark">
            <div className="text-white font-medium prose ">
              <p>
                The PixelMap smart contract was deployed in 2016 - way before
                NFTs were a thing, and way before ERC721 existed.
              </p>
              <p>
                By following these steps carefully, you can successfully wrap
                your PixelMap tile so that you can do the wonderful things
                ERC721 provides - transfer to different wallets, swap your tile
                with other people, and trade them on any NFT marketplace!
              </p>
            </div>
          </div>

          {account && (
            <div className="mt-4">
              {ownedTiles.map((ownedTile: TileAsset, index: number) => (
                <WrapTile
                  key={index}
                  tile={ownedTile}
                  index={index}
                  handlePriceChange={handlePriceChange}
                  handleSave={handleSave}
                  handleWrap={handleWrap}
                  handleRefresh={handleRefresh}
                />
              ))}
            </div>
          )}

          {!account && (
            <div className="nes-container mt-4 bg-yellow-300 text-center">
              <h3 className="font-bold text-lg md:text-xl mb-4">
                Connect your account to wrap your tiles.
              </h3>
              <Account triedToEagerConnect={triedToEagerConnect} />
            </div>
          )}
        </main>
      </Layout>
    </>
  );
}

export default Wrap;
