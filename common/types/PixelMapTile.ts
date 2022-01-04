import {PixelMapImage} from "./PixelMapImage";

export interface PixelMapTile {
  id?: number, // The ID of the actual tile
  image?: string, // Image of the tile as a hex triplet (optionally Base91 encoded with Pako compression)
  url?: string, // URL link on the tile
  price?: number, // Current price (on the OG contract)
  owner?: string, // Current owner (Ethereum HEX address)
  wrapped?: boolean, // Wrapped in ERC721 contract?
  openseaPrice?: number, // Price currently listed on OpenSea
  newPrice?: string, // No clue
  updating?: string, // No clue
  errorMessage? :string // No clue
  ens?: string; // ENS name of the owner (if found)
  historical_images?: PixelMapImage[]
}
