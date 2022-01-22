import { GameObject } from "./gameObject";
import { OverworldMap } from "./overworldMap";
import { utils } from "./utils";
import { Person } from "./person";
import { DirectionInput } from "./directionInput";
import { decompressTileCode } from "../utils/ImageUtils";

export default class Overworld {
  public element: any;
  public canvas: any;
  public ctx: any;
  private map: OverworldMap;
  private directionInput: DirectionInput;
  private tileImage: any;
  public tileSetImage;

  constructor(config, tile) {
    this.canvas = config.current;
    this.ctx = this.canvas.getContext("2d");
    this.tileImage = tile ? tile.image : "";
    this.tileSetImage = new Image();
    this.tileSetImage.src = "/assets/images/tileHouse/zeldaHouse.png";
  }

  startGameLoop() {
    // Example usage:
    let render = 0;

    const engine = new FixedStepEngine(
      15,
      (deltaTime) => {
        Object.values(this.map.gameObjects).forEach((object) => {
          object.sprite.updateAnimationProgress();
        });
        // console.log("Update", deltaTime);
        // Clear the Canvas
      },
      240,
      (deltaTime) => {
        // console.log("Render", deltaTime);
        // Draw bottom layer
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        const cameraPerson = this.map.gameObjects["hero"];

        // this.map.drawLowerImage(this.ctx, cameraPerson);
        this.map.drawTileSet(this.ctx, cameraPerson);
        // this.ctx.fillRect(50, 50, 100, 100);
        // this.map.drawTile(this.ctx, this.tileImage, cameraPerson);
        Object.values(this.map.gameObjects).forEach((object) => {
          object.update({
            arrow: this.directionInput.heldDirections,
            map: this.map,
          });
          object.sprite.draw(this.ctx, cameraPerson);
        });

        render++;
      }
    );
    engine.start();
  }

  init() {
    this.ctx.imageSmoothingEnabled = false;
    // const image = new Image();
    // image.onload = () => {
    //   this.ctx.drawImage(image, 0, 0);
    // };
    // image.src = "/assets/images/tileHouse1.png";

    const overworldMaps = {
      DemoRoom: {
        lowerSrc: "/assets/images/tileHouse/zeldaHouse.png",
        upperSrc: "/assets/images/tileHouse/houseTop.png",
        gameObjects: {
          hero: new Person({
            x: utils.withGrid(28),
            y: utils.withGrid(10),
          }),
        },
        walls: [
          { x1: 22, x2: 31, y1: 14.5, y2: 25 }, // Bottom Left Wall
          { x1: 31.5, x2: 40, y1: 14.5, y2: 25 }, // Bottom Right Wall
          { x1: 22, x2: 40, y1: 15.5, y2: 25 }, // Bottom
          { x1: 34, x2: 37, y1: 11.5, y2: 25 }, // Bed
          { x1: 36, x2: 40, y1: 0, y2: 40 }, // Right Wall
          { x1: 22, x2: 26, y1: 0, y2: 40 }, // Right Wall
          { x1: 0, x2: 40, y1: 0, y2: 5 }, // Top Wall
          { x1: 24, x2: 27.5, y1: 3, y2: 7 }, // Pot
          { x1: 24, x2: 29.5, y1: 6, y2: 8.2 }, // Table
        ],
      },
    };

    this.map = new OverworldMap(overworldMaps.DemoRoom);
    this.directionInput = new DirectionInput();
    this.directionInput.init();
    this.startGameLoop();
  }
}

class FixedStepEngine {
  private updateFps: any;
  private renderFps: any;
  private update: any;
  private render: any;
  private updateInterval: number;
  private renderInterval: number;
  private sinceLastUpdate: number;
  private sinceLastRender: number;
  private running: boolean;
  private lastTime: DOMHighResTimeStamp;

  constructor(updateFps, update, renderFps, render) {
    this.updateFps = updateFps;
    this.renderFps = renderFps;
    this.update = update;
    this.render = render;

    this.updateInterval = 1000 / this.updateFps / 1000;
    this.renderInterval = 1000 / this.renderFps / 1000;
    this.sinceLastUpdate = 0;
    this.sinceLastRender = 0;
    this.running = false;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.gameLoop);
  }

  stop() {
    this.running = false;
  }

  gameLoop = (timestamp) => {
    const deltaTime = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    // console.log(timestamp, deltaTime * 1000);

    this.sinceLastUpdate += deltaTime;
    this.sinceLastRender += deltaTime;

    while (this.sinceLastUpdate >= this.updateInterval) {
      this.update(this.updateInterval);
      this.sinceLastUpdate -= this.updateInterval;
    }
    if (this.renderFps != null) {
      let renders = 0;
      while (this.sinceLastRender >= this.renderInterval) {
        renders++;
        this.sinceLastRender -= this.renderInterval;
      }
      if (renders > 0) {
        this.render(this.renderInterval * renders);
      }
    }
    if (this.running) {
      requestAnimationFrame(this.gameLoop);
    }
  };
}
