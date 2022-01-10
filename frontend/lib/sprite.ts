import { GameObject } from "./gameObject";

interface SpriteProps {
  src: string;
  animations: any;
  currentAnimation: string;
  gameObject: GameObject;
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

    this.animations = props.animations || {
      idleDown: [[0, 0]],
    };
    this.currentAnimation = props.currentAnimation || "idleDown";
    this.currentAnimationFrame = 0;

    this.gameObject = props.gameObject;
  }

  draw(ctx) {
    const x = this.gameObject.x - 8;
    const y = this.gameObject.y - 8;
    this.isShadowLoaded &&
      ctx.drawImage(this.shadow, 0, 0, 32, 32, x - 10, y - 15, 64, 64);
    this.isLoaded && ctx.drawImage(this.image, 0, 0, 32, 32, x, y, 64, 64);
  }
}
