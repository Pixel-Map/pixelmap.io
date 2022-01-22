import { utils } from "./utils";
import { decompressTileCode } from "../utils/ImageUtils";

export class OverworldMap {
  public gameObjects: { GameObject };
  private lowerImage: any;
  private upperImage: any;
  private walls: any;

  constructor(props) {
    this.gameObjects = props.gameObjects;
    this.walls = props.walls;

    // Bottom Layer
    this.lowerImage = new Image();
    this.lowerImage.src = props.lowerSrc;

    // Overhead Layer
    this.upperImage = new Image();
    this.upperImage.src = props.upperSrc;
  }

  drawLowerImage(ctx, cameraPerson) {
    ctx.drawImage(
      this.lowerImage,
      utils.withGrid(31) - cameraPerson.x,
      utils.withGrid(8.5) - cameraPerson.y
    );
  }

  drawTileSet(ctx, cameraPerson) {
    let tileSize = 16;
    let tileOutputSize = 1;
    let updatedTileSize = tileSize * tileOutputSize;
    let mapColumn = 14;
    let mapRow = 14;
    let mapHeight = mapRow * tileSize;
    let mapWidth = mapColumn * tileSize;
    let level1Map = [
      1, 2, 3, 4, 5, 3, 4, 5, 3, 4, 5, 3, 6, 7, 28, 29, 30, 31, 32, 30, 31, 32,
      30, 31, 32, 30, 33, 34, 55, 56, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57,
      60, 61, 82, 83, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 87, 88, 109, 110,
      57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 114, 115, 55, 56, 57, 57, 57, 57,
      57, 57, 57, 57, 57, 57, 60, 61, 82, 83, 57, 57, 57, 57, 57, 57, 57, 57,
      57, 57, 87, 88, 109, 110, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 114,
      115, 55, 56, 57, 57, 57, 57, 57, 57, 57, 57, 57, 57, 60, 61, 82, 83, 57,
      57, 57, 57, 57, 57, 57, 57, 57, 57, 87, 88, 55, 56, 57, 57, 57, 57, 57,
      57, 57, 57, 57, 57, 60, 61, 82, 83, 57, 57, 57, 57, 57, 57, 57, 57, 57,
      57, 87, 88, 109, 137, 138, 139, 140, 138, 139, 140, 138, 139, 140, 138,
      141, 115, 163, 164, 165, 166, 167, 165, 166, 167, 165, 166, 167, 165, 168,
      169,
    ];
    let mapIndex = 0;
    let sourceX = 0;
    let sourceY = 0;
    const atlasCol = 27;

    const tileSetImage = new Image();
    tileSetImage.src = "/assets/images/tileHouse/tileset.png";
    for (let col = 0; col < mapHeight; col += tileSize) {
      for (let row = 0; row < mapWidth; row += tileSize) {
        let tileVal = level1Map[mapIndex];

        if (tileVal != 0) {
          tileVal -= 1;
          sourceY = Math.floor(tileVal / atlasCol) * tileSize;
          sourceX = (tileVal % atlasCol) * tileSize;
          ctx.drawImage(
            tileSetImage,
            sourceX,
            sourceY,
            tileSize,
            tileSize,
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
