import { GameObject } from "./gameObject";

export class Person extends GameObject {
  private directionUpdate;

  constructor(props) {
    super(props);
    this.directionUpdate = {
      Up: ["y", -1],
      Down: ["y", 1],
      Left: ["x", -1],
      Right: ["x", 1],
    };
  }

  update(state): void {
    if (state.arrow[0]) {
      this.startBehavior(state, {
        type: "walk",
        direction: state.arrow[0],
      });
    }
    this.updateSprite(state);
  }

  startBehavior(state, behavior) {
    this.direction = behavior.direction;
    if (behavior.type === "walk") {
      for (const direction of state.arrow) {
        if (state.map.isSpaceTaken(this.x, this.y, direction)) {
          return;
        }
        this.updatePosition(direction, state.delta);
      }
    }
  }

  updatePosition(direction, deltaTime) {
    const [property, change] = this.directionUpdate[direction];
    console.log(deltaTime);
    if (deltaTime) {
      this[property] += change * (deltaTime * 130);
    }
  }

  updateSprite(state) {
    if (state.arrow[0]) {
      this.sprite.setAnimation("walk" + this.direction);
      return;
    }
    this.sprite.setAnimation("idle" + this.direction);
  }
}
