import { Sprite } from "./sprite";

export class GameObject {
  protected x: number;
  protected y: number;
  sprite: Sprite;
  protected direction: string;

  constructor(props) {
    this.x = props.x || 0;
    this.y = props.y || 0;
    this.direction = props.direction || "Down";
    this.sprite = new Sprite({
      gameObject: this,
      src: props.src || "/assets/images/tileHouse/characters/link.png",
      animations: [],
      currentAnimation: "walkDown",
      animationFrameLimit: 16,
    });
  }

  update(state): void {}
}
