import { OverworldMap } from "./overworldMap";
import { utils } from "./utils";
import { Person } from "./person";
import { DirectionInput } from "./directionInput";
import { Polygon, System } from "detect-collisions";

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
    const cameraPerson = this.map.gameObjects["hero"];
    this.map.createCollisionBodies(this.ctx, cameraPerson);
    const engine = new FixedStepEngine(
      15,
      (deltaTime) => {
        Object.values(this.map.gameObjects).forEach((object) => {
          object.sprite.updateAnimationProgress();
        });
        // console.log("Update", deltaTime);

        // Current Location == (Hero Location + Half Map Size) / Size of Tiles
        const currentLocationX = Math.round(
          (cameraPerson.x + utils.withGrid(7)) / 16
        );
        const currentLocationY = Math.round(
          (cameraPerson.y + utils.withGrid(7)) / 16
        );
        // console.log(
        //   `Player Current Location: (${currentLocationX}, ${currentLocationY})`
        // );
        // Clear the Canvas
      },
      240,
      (deltaTime) => {
        this.handleInput(deltaTime);
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.map.drawTileSet(this.ctx, cameraPerson);
        this.map.drawCollisionBoxes(this.ctx, cameraPerson);

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

  handleInput(deltaTime) {
    Object.values(this.map.gameObjects).forEach((object) => {
      object.update({
        arrow: this.directionInput.heldDirections,
        map: this.map,
        delta: deltaTime,
      });
    });
  }

  init() {
    this.ctx.imageSmoothingEnabled = false;

    const overworldMaps = {
      DemoRoom: {
        lowerSrc: "/assets/images/tileHouse/zeldaHouse.png",
        upperSrc: "/assets/images/tileHouse/houseTop.png",
        gameObjects: {
          hero: new Person({
            x: utils.withGrid(25), // 28
            y: utils.withGrid(10), // 10
          }),
        },
        walls: [],
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
