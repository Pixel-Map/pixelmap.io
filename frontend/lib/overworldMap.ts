import { utils } from "./utils";
import { decompressTileCode } from "../utils/ImageUtils";
import DefaultTileHouse from "../lib/tiled/maps/defaultTileHouse.json";
import TileSet from "../lib/tiled/tileset.json";
import { Polygon, System } from "detect-collisions";

export class OverworldMap {
  public gameObjects: { GameObject };
  private lowerImage: any;
  private upperImage: any;
  private walls: any;
  private tileSetImage: any;
  private system: System;
  private level1Map;
  private collisionWalls: Polygon[];
  private player: Polygon;

  constructor(props) {
    this.gameObjects = props.gameObjects;
    this.walls = props.walls;

    // Load TileHouse
    this.level1Map = DefaultTileHouse.layers[0].data;

    // Bottom Layer
    this.lowerImage = new Image();
    this.lowerImage.src = props.lowerSrc;

    // Overhead Layer
    this.upperImage = new Image();
    this.upperImage.src = props.upperSrc;

    this.tileSetImage = new Image();
    this.tileSetImage.src = "/assets/images/tileHouse/tileset.png";
  }

  createCollisionBodies(ctx, cameraPerson) {
    this.system = new System();
    let tileHeight = DefaultTileHouse.tileheight;
    let tileOutputSize = 1;
    let updatedTileSize = tileHeight * tileOutputSize;
    let mapColumn = DefaultTileHouse.width;
    let mapRow = DefaultTileHouse.height;
    let mapHeight = mapRow * tileHeight;
    let mapWidth = mapColumn * tileHeight;
    this.collisionWalls = [];

    let mapIndex = 0;
    let sourceX = 0;
    let sourceY = 0;
    const atlasCol = 27;
    this.player = new Polygon(
      {
        x: cameraPerson.x - 1 + utils.withGrid(7.5),
        y: cameraPerson.y + 7 + utils.withGrid(7),
      },
      [
        { x: 0, y: 0 },
        { x: 5, y: 0 },
        { x: 5, y: 5 },
        { x: 0, y: 5 },
      ]
    );
    this.system.insert(this.player);

    for (let col = 0; col < mapHeight; col += tileHeight) {
      for (let row = 0; row < mapWidth; row += tileHeight) {
        let tileVal = this.level1Map[mapIndex];

        if (tileVal != 0) {
          tileVal -= 1;
          sourceY = Math.floor(tileVal / atlasCol) * tileHeight;
          sourceX = (tileVal % atlasCol) * tileHeight;

          const identifiedTile = TileSet.tiles.find((tile) => {
            return tile.id === tileVal;
          });
          if (identifiedTile.objectgroup != undefined) {
            // console.log(identifiedTile);
            for (const object of identifiedTile.objectgroup.objects) {
              this.collisionWalls.push(
                this.system.createPolygon(
                  {
                    x: row * tileOutputSize + utils.withGrid(28) + object.x,
                    y: col * tileOutputSize + utils.withGrid(10) + object.y,
                  },
                  [
                    { x: 0, y: 0 },
                    { x: object.width, y: 0 },
                    { x: object.width, y: object.height },
                    { x: 0, y: object.height },
                  ]
                )
              );
            }
          }
        }
        mapIndex++;
      }
    }
  }

  drawCollisionBoxes(ctx) {
    ctx.strokeStyle = "#ffaaaf";
    ctx.beginPath();

    this.system.draw(ctx);

    ctx.stroke();
  }

  drawTileSet(ctx) {
    let tileHeight = DefaultTileHouse.tileheight;
    let tileOutputSize = 1;
    let updatedTileSize = tileHeight * tileOutputSize;
    let mapColumn = DefaultTileHouse.width;
    let mapRow = DefaultTileHouse.height;
    let mapHeight = mapRow * tileHeight;
    let mapWidth = mapColumn * tileHeight;

    let mapIndex = 0;
    let sourceX = 0;
    let sourceY = 0;
    const atlasCol = 27;

    for (let col = 0; col < mapHeight; col += tileHeight) {
      for (let row = 0; row < mapWidth; row += tileHeight) {
        let tileVal = this.level1Map[mapIndex];

        if (tileVal != 0) {
          tileVal -= 1;
          sourceY = Math.floor(tileVal / atlasCol) * tileHeight;
          sourceX = (tileVal % atlasCol) * tileHeight;
          ctx.drawImage(
            this.tileSetImage,
            sourceX,
            sourceY,
            tileHeight,
            tileHeight,
            row * tileOutputSize + utils.withGrid(28),
            col * tileOutputSize + utils.withGrid(10),
            updatedTileSize,
            updatedTileSize
          );
        }
        mapIndex++;
      }
    }
  }

  drawTile(ctx, tileImage, cameraPerson) {
    let hex = decompressTileCode(tileImage);

    if (hex.length != 768) {
      return;
    }

    hex = hex.match(/.{1,3}/g);

    let index = 0;

    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        ctx.fillStyle = `#${hex[index]}`;
        ctx.fillRect(x - cameraPerson.x + 616, y - cameraPerson.y + 173, 1, 1);
        index++;
      }
    }
  }

  isSpaceTaken(currentX, currentY, direction) {
    const { x, y } = utils.nextPosition(currentX, currentY, direction);
    const nextGridX = utils.getGridPosition(x);
    const nextGridY = utils.getGridPosition(y);

    // Update Player Bounding Box
    this.player.setPosition(x - 1 + utils.withGrid(7.5), y + utils.withGrid(7));
    this.system.update();
    for (const collider of this.system.getPotentials(this.player)) {
      if (this.system.checkCollision(this.player, collider)) {
        return true;
      }
    }
    return false;
  }
}
