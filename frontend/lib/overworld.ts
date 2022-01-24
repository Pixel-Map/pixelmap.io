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

    const cameraPerson = this.map.gameObjects["hero"];
    this.map.createCollisionBodies(this.ctx, cameraPerson);
    const engine = new FixedStepEngine((deltaTime) => {
      this.handleInput(deltaTime);

      this.processGameLogic(deltaTime);
      this.render(cameraPerson);
    });
    engine.start();
  }

  processGameLogic(deltaTime) {
    Object.values(this.map.gameObjects).forEach((object) => {
      object.sprite.updateAnimationProgress(deltaTime);
    });
  }

  render(cameraPerson) {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.translate(-cameraPerson.x, -cameraPerson.y);
    this.map.drawTileSet(this.ctx);

    Object.values(this.map.gameObjects).forEach((object) => {
      object.sprite.draw(this.ctx);
    });
    // this.map.drawCollisionBoxes(this.ctx);
    this.ctx.restore();
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
  private update: any;
  private sinceLastUpdate: number;
  private running: boolean;
  private lastTime: DOMHighResTimeStamp;

  constructor(update) {
    this.update = update;
    this.sinceLastUpdate = 0;
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

    this.update(deltaTime);

    if (this.running) {
      requestAnimationFrame(this.gameLoop);
    }
  };
}
