import { GameObject } from "./gameObject";
import { OverworldMap } from "./overworldMap";
import { utils } from "./utils";
import { Person } from "./person";
import { DirectionInput } from "./directionInput";

export default class Overworld {
  public element: any;
  public canvas: any;
  public ctx: any;
  private map: OverworldMap;
  private directionInput: DirectionInput;

  constructor(config) {
    this.canvas = config.current;
    this.ctx = this.canvas.getContext("2d");
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

        this.map.drawLowerImage(this.ctx, cameraPerson);
        Object.values(this.map.gameObjects).forEach((object) => {
          object.update({
            arrow: this.directionInput.heldDirections,
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
        lowerSrc: "/assets/images/tileHouse1.png",
        upperSrc: "/assets/images/tileHouse1.png",
        gameObjects: {
          hero: new Person({
            x: utils.withGrid(28),
            y: utils.withGrid(10),
          }),
        },
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
