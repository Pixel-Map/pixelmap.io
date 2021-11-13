export interface Tile {
  id: string;
  url: string;
  image: string;
  owner: string;
  price: number;
  wrapped: boolean;
  openseaPrice: number;
  lastUpdated: number;
}
