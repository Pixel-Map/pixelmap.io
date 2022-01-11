import { GameObject } from "./gameObject";

export class Person extends GameObject {
  private directionUpdate;

  constructor(props) {
    super(props);
    this.directionUpdate = {
      Up: ["y", -1.6],
      Down: ["y", 1.6],
      Left: ["x", -1.6],
      Right: ["x", 1.6],
    };
  }

  update(state): void {
    this.updateSprite(state);
    if (state.arrow[0]) {
      this.direction = state.arrow[0];
      for (const direction of state.arrow) {
        this.updatePosition(direction);
      }
    }
  }

  updatePosition(direction) {
    const [property, change] = this.directionUpdate[direction];
    this[property] += change;
  }

  updateSprite(state) {
    if (state.arrow[0]) {
      this.sprite.setAnimation("walk" + this.direction);
    } else {
      this.sprite.setAnimation("idle" + this.direction);
    }
  }
}
