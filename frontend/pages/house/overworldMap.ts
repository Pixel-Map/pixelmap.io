export class OverworldMap {
  public gameObjects: { GameObject };
  private lowerImage: any;
  private upperImage: any;

  constructor(props) {
    this.gameObjects = props.gameObjects;

    // Bottom Layer
    this.lowerImage = new Image();
    this.lowerImage.src = props.lowerSrc;

    // Overhead Layer
    this.upperImage = new Image();
    this.upperImage.src = props.upperSrc;
  }

  drawLowerImage(ctx) {
    ctx.drawImage(this.lowerImage, 0, 0);
  }

  drawUpperImage(ctx) {
    ctx.drawImage(this.upperImage, 0, 0);
  }
}
