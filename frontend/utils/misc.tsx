import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import { parse } from "path";
import { TileAsset } from '../types/TileAsset';

export function shortenHex(hex: string, length = 4) {
  return `${hex.substring(0, length + 2)}…${hex.substring(
    hex.length - length
  )}`;
}

const ETHERSCAN_PREFIXES = {
  1: "",
  3: "ropsten.",
  4: "rinkeby.",
  5: "goerli.",
  42: "kovan.",
};

export function formatEtherscanLink(
  type: "Account" | "Transaction",
  data: [number, string]
) {
  switch (type) {
    case "Account": {
      const [chainId, address] = data;
      return `https://${ETHERSCAN_PREFIXES[chainId]}etherscan.io/address/${address}`;
    }
    case "Transaction": {
      const [chainId, hash] = data;
      return `https://${ETHERSCAN_PREFIXES[chainId]}etherscan.io/tx/${hash}`;
    }
  }
}

export const parseBalance = (
  value: BigNumberish,
  decimals = 18,
  decimalsToDisplay = 3
) => {
  return new Intl.NumberFormat('en-US', { currency: 'USD', style: 'decimal'}).format(parseFloat(formatUnits(value, decimals)));
}

export const cleanUrl = (url: string) => {
  let regex = new RegExp("^(http|https)://", "i");
  
  if( regex.test(url) ) {
    return url;
  } else {
    return `https://${url}`;
  }
}

export const tilePrice = (tile: TileAsset) => {
  let osPrice = "0";

  if (tile.openseaPrice && !tile.openseaPrice.match(/[^$,.\d]/)) osPrice = tile.openseaPrice;
  
  return (BigNumber.from(osPrice).gt(0) ? tile.openseaPrice.toString() : (tile.price.toString() || "0"));
}

export const priceToEth = (tile: TileAsset) => {
  let price = tilePrice(tile);

  return formatUnits(price, "ether").toString() || "0";
}

export const formatPrice = (tile: TileAsset) => {
  let price = priceToEth(tile);
  
  if( price === "0.0" ) {
    return '–';
  }
  
  return `${price}Ξ`;
}

export const openseaLink = (id: number) => {
 return `https://opensea.io/assets/${process.env.NEXT_PUBLIC_PIXELMAP_WRAPPER_CONTRACT}/${id}`
}

export const convertEthToWei = (price: string) => {
  return parseUnits(price || "0", "ether");
}