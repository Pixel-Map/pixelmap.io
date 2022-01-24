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
    const player = new Polygon(
      {
        x: cameraPerson.x - 1 + utils.withGrid(7.5) - cameraPerson.x,
        y: cameraPerson.y + 7 + utils.withGrid(7) - cameraPerson.y,
      },
      [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 6 },
        { x: 0, y: 6 },
      ]
    );
    this.system.insert(player);
    this.system.update();
    this.system.checkOne(player, (result) => {
      console.log(result);
    });

    const potentials = this.system.getPotentials(player);
    console.log(potentials);
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
                    x:
                      row * tileOutputSize +
                      utils.withGrid(28) -
                      cameraPerson.x +
                      object.x,
                    y:
                      col * tileOutputSize +
                      utils.withGrid(10) -
                      cameraPerson.y +
                      object.y,
                  },
                  [
                    { x: 0, y: 0 },
                    { x: object.width, y: 0 },
                    { x: object.width, y: object.height },
                    { x: 0, y: object.height },
                    // { x: 0, y: 0 },
                    // { x: tileHeight, y: 0 },
                    // { x: tileHeight, y: tileHeight },
                    // { x: 0, y: tileHeight },
                  ]
                )
              );
            }
          }
          // ctx.drawImage(
          //   this.tileSetImage,
          //   sourceX,
          //   sourceY,
          //   tileHeight,
          //   tileHeight,
          //   row * tileOutputSize + utils.withGrid(28) - cameraPerson.x,
          //   col * tileOutputSize + utils.withGrid(10) - cameraPerson.y,
          //   updatedTileSize,
          //   updatedTileSize
          // );
        }
        mapIndex++;
      }
    }
  }

  drawCollisionBoxes(ctx, cameraPerson) {
    // Collision?
    ctx.strokeStyle = "#ffaaaf";
    ctx.beginPath();

    this.system.draw(ctx);

    ctx.stroke();
  }

  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.lowerImage,
      utils.withGrid(31) - cameraPerson.x,
      utils.withGrid(8.5) - cameraPerson.y
    );
  }

  drawTileSet(ctx, cameraPerson) {
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
            row * tileOutputSize + utils.withGrid(28) - cameraPerson.x,
            col * tileOutputSize + utils.withGrid(10) - cameraPerson.y,
            updatedTileSize,
            updatedTileSize
          );
        }
        mapIndex++;
      }
    }
  }

  drawTile(ctx, tileImage, cameraPerson) {
    // this.map.drawUpperImage(this.ctx, cameraPerson);
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

  drawUpperImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.upperImage,
      utils.withGrid(28) - cameraPerson.x,
      utils.withGrid(8.5) - cameraPerson.y
    );
  }

  isSpaceTaken(currentX, currentY, direction) {
    const { x, y } = utils.nextPosition(currentX, currentY, direction);
    const nextGridX = utils.getGridPosition(x);
    const nextGridY = utils.getGridPosition(y);
    // console.log(
    //   `Previous: ${utils.getGridPosition(currentX)},${utils.getGridPosition(
    //     currentY
    //   )}`
    // );
    // console.log(`Next: ${nextGridX},${nextGridY}`);

    for (const wall of this.walls) {
      if (
        nextGridX > wall.x1 &&
        nextGridX < wall.x2 &&
        nextGridY > wall.y1 &&
        nextGridY < wall.y2
      ) {
        return true;
      }
    }

    return this.walls[`${x},${y}`] || false;
  }
}
