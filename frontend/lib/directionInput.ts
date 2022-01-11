export class DirectionInput {
  public heldDirections: any[];
  private readonly map: {
    KeyA: string;
    KeyD: string;
    KeyS: string;
    ArrowLeft: string;
    KeyW: string;
    ArrowUp: string;
    ArrowRight: string;
    ArrowDown: string;
  };

  constructor() {
    this.heldDirections = [];
    this.map = {
      KeyW: "Up",
      ArrowUp: "Up",
      KeyS: "Down",
      ArrowDown: "Down",
      KeyA: "Left",
      ArrowLeft: "Left",
      KeyD: "Right",
      ArrowRight: "Right",
    };
  }

  init() {
    document.addEventListener("keydown", (e) => {
      const dir = this.map[e.code];
      if (dir && this.heldDirections.indexOf(dir) === -1) {
        this.heldDirections.unshift(dir);
      }
    });
    document.addEventListener("keyup", (e) => {
      const dir = this.map[e.code];
      const index = this.heldDirections.indexOf(dir);
      if (index > -1) {
        this.heldDirections.splice(index, 1);
      }
    });
  }

  get direction() {
    return this.heldDirections;
  }
}
