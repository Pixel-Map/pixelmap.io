import { Sprite } from "./sprite";

export class GameObject {
  private x: number;
  private y: number;
  sprite: Sprite;

  constructor(props) {
    this.x = props.x || 0;
    this.y = props.y || 0;
    this.sprite = new Sprite({
      gameObject: this,
      src: props.src || "/assets/images/tileHouse/characters/link.png",
      animations: [],
      currentAnimation: "idleDown",
    });
  }
}
