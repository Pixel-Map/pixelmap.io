import { GameObject } from "./gameObject";
import { OverworldMap } from "./overworldMap";

export default class Overworld {
  public element: any;
  public canvas: any;
  public ctx: any;
  private map: OverworldMap;

  constructor(config) {
    this.canvas = config.current;
    this.ctx = this.canvas.getContext("2d");
  }

  startGameLoop() {
    const step = () => {
      this.map.drawLowerImage(this.ctx);
      Object.values(this.map.gameObjects).forEach((object) => {
        object.sprite.draw(this.ctx);
      });

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
          hero: new GameObject({
            x: 28,
            y: 10,
          }),
        },
      },
    };

    this.map = new OverworldMap(overworldMaps.DemoRoom);

    this.startGameLoop();
  }
}
