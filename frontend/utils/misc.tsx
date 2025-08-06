import type { BigNumberish } from "@ethersproject/bignumber";
import { formatUnits, parseUnits } from "@ethersproject/units";
import type { PixelMapTile } from "@pixelmap/common/types/PixelMapTile";

export function shortenIfHex(hex: string, length = 12) {
  if (hex.length < length) {
    return hex;
  }
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
  const [chainId, addressOrHash] = data;
  const prefix = ETHERSCAN_PREFIXES[chainId] || "";
  
  switch (type) {
    case "Account": {
      return `https://${prefix}etherscan.io/address/${addressOrHash}`;
    }
    case "Transaction": {
      return `https://${prefix}etherscan.io/tx/${addressOrHash}`;
    }
    default:
      return `https://${prefix}etherscan.io`;
  }
}

export const parseBalance = (
  value: BigNumberish,
  decimals = 18,
  decimalsToDisplay = 3
) => {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "decimal",
  }).format(Number.parseFloat(formatUnits(value, decimals)));
};

export const cleanUrl = (url: string | undefined) => {
  if (!url) return '#';
  
  let regex = new RegExp("^(http|https)://", "i");

  if (regex.test(url)) {
    return url;
  } else {
    return `https://${url}`;
  }
};

export const formatPrice = (tile: PixelMapTile) => {
  let price = tile.openseaPrice;

  if (price === 0.0) {
    return "–";
  }

  return `${price}Ξ`;
};

export const openseaLink = (id: number | undefined) => {
  if (!id) return 'https://opensea.io/collection/pixelmap-io';
  return `https://opensea.io/assets/${process.env.NEXT_PUBLIC_PIXELMAP_WRAPPER_CONTRACT}/${id}`;
};

export const convertEthToWei = (price: string | undefined) => {
  return parseUnits(price || "0", "ether");
};
