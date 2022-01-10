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
    const step = () => {
      // Clear the Canvas
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      // Draw bottom layer
      this.map.drawLowerImage(this.ctx);
      Object.values(this.map.gameObjects).forEach((object) => {
        object.update({
          arrow: this.directionInput.heldDirections,
        });
        object.sprite.draw(this.ctx);
      });

      // Draw top layer
      // this.map.drawUpperImage(this.ctx);

      requestAnimationFrame(() => {
        step();
      });
    };
    step();
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
