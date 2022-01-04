export interface PixelMapImage {
  image: string, // Image of the tile as a hex triplet (optionally Base91 encoded with Pako compression)
  image_url: string, // Link to the rendered image
  blockNumber: number, // Which block was the update made?
  date: Date, // Date when the update occurred
}
