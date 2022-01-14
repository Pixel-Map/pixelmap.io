import { GameObject } from "./gameObject";
import { utils } from "./utils";

interface SpriteProps {
  src: string;
  animations: any;
  currentAnimation: string;
  gameObject: GameObject;
  animationFrameLimit: number;
}

export class Sprite {
  private animations: any;
  private currentAnimation: string;
  private currentAnimationFrame: number;
  private image;
  private isLoaded: boolean;
  private gameObject: any;
  private shadow;
  private isShadowLoaded: boolean;
  private useShadow: boolean;
  private animationFrameLimit: number = 16;

  constructor(props: SpriteProps) {
    // Image
    this.image = new Image();
    this.image.src = props.src;
    this.image.onload = () => {
      this.isLoaded = true;
    };

    // Shadow
    this.shadow = new Image();
    this.shadow.src = "/assets/images/tileHouse/characters/shadow.png";
    this.shadow.onload = () => {
      this.isShadowLoaded = true;
    };
    this.useShadow = true;

    this.animations = {
      idleUp: [[1, 0]],
      idleDown: [[0, 0]],
      idleLeft: [[2, 0]],
      idleRight: [[3, 0]],
      walkUp: [
        [1, 4],
        [2, 4],
        [3, 4],
        [4, 4],
        [5, 4],
        [6, 4],
        [7, 4],
      ],
      walkDown: [
        [1, 1],
        [2, 1],
        [3, 1],
        [4, 1],
        [5, 1],
        [6, 1],
        [7, 1],
      ],
      walkLeft: [
        [1, 3],
        [2, 3],
        [3, 3],
        [4, 3],
        [5, 3],
      ],
      walkRight: [
        [1, 2],
        [2, 2],
        [3, 2],
        [4, 2],
        [5, 2],
      ],
    };

    this.currentAnimation = props.currentAnimation || "walkDown";
    this.currentAnimationFrame = 0;

    this.animationFrameLimit = props.animationFrameLimit || 16;

    this.gameObject = props.gameObject;
  }

  get frame() {
    return this.animations[this.currentAnimation][this.currentAnimationFrame];
  }

  setAnimation(key) {
    if (this.currentAnimation !== key) {
      this.currentAnimation = key;
      this.currentAnimationFrame = 0;
    }
  }

  updateAnimationProgress() {
    this.currentAnimationFrame += 1;
    if (this.frame === undefined) {
      this.currentAnimationFrame = 0;
    }
  }

  draw(ctx, cameraPerson) {
    const x = this.gameObject.x - 8 + utils.withGrid(7.5) - cameraPerson.x;
    const y = this.gameObject.y - 8 + utils.withGrid(7) - cameraPerson.y;

    const [frameX, frameY] = this.frame;

    // this.isShadowLoaded &&
    //   ctx.drawImage(this.shadow, 0, 0, 32, 32, x, y + 0, 24, 24);
    this.isLoaded &&
      ctx.drawImage(this.image, frameX * 24, frameY * 24, 24, 24, x, y, 24, 24);
  }
}
