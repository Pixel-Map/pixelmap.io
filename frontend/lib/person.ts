import { GameObject } from "./gameObject";

export class Person extends GameObject {
  private directionUpdate;

  constructor(props) {
    super(props);
    this.directionUpdate = {
      up: ["y", -1],
      down: ["y", 1],
      left: ["x", -1],
      right: ["x", 1],
    };
  }

  update(state): void {
    if (state.arrow[0]) {
      for (const direction of state.arrow) {
        this.updatePosition(direction);
      }
    }
  }

  updatePosition(direction) {
    const [property, change] = this.directionUpdate[direction];
    this[property] += change;
  }
}
