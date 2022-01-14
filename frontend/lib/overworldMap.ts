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
