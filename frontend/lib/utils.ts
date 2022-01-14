export const utils = {
  withGrid(n) {
    return n * 16;
  },
  getGridPosition(n) {
    return parseFloat((n / 16).toFixed(2));
  },

  asGridCoord(x, y) {
    return `${x * 16},${y * 16}`;
  },
  nextPosition(initialX, initialY, direction) {
    let x = initialX;
    let y = initialY;
    const size = 8;
    if (direction === "Left") {
      x -= size;
    } else if (direction == "Right") {
      x += size;
    } else if (direction == "Up") {
      y -= size;
    } else if (direction == "Down") {
      y += size;
    }
    return { x, y };
  },
};
