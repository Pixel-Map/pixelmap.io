import { BigInt } from "@graphprotocol/graph-ts"
import { PixelMap, TileUpdated } from "../generated/PixelMap/PixelMap"
import {Tile, TileData} from "../generated/schema"

export function handleTileUpdated(event: TileUpdated): void {
  // Entities can be loaded from the store using a string ID; this ID
  // needs to be unique across all entities of the same type
  let entity = Tile.load(event.transaction.from.toHex())

  // Entities only exist after they have been saved to the store;
  // `null` checks allow to create entities on demand
  if (!entity) {
    entity = new Tile(event.transaction.from.toHex())
    entity.historicalTileData = new Array<string>(0);
  }

  let pixelmap = PixelMap.bind(event.address)
  let callResult = pixelmap.tiles(event.params.location)
  if (entity.image != callResult.value1 || entity.url != callResult.value2) {
    entity.image = callResult.value1
    entity.url = callResult.value2
    let newTileData = new TileData(event.transaction.from.toHex()  + '-'
        + event.logIndex.toString())
    newTileData.url = entity.url
    newTileData.image = entity.image
    newTileData.timestamp = event.block.timestamp
    newTileData.save()

    let historicalData = entity.historicalTileData
    historicalData.push(newTileData.id)
    entity.historicalTileData = historicalData
  }

  entity.price = callResult.value3
  entity.location = event.params.location
  entity.lastUpdated = event.block.timestamp
  entity.save()
}
