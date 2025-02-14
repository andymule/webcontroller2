import BaseEntity from "./BaseEntity";

export default class Ship extends BaseEntity {
  constructor(scene, x, y) {
    // Ensure the ship texture is created.
    Ship.ensureTexture(scene);
    super(scene, x, y, "ship");
    this.setDamping(true);
    this.setDrag(0.9);
    this.setMaxVelocity(300);
  }

  static ensureTexture(scene) {
    if (!scene.textures.exists("ship")) {
      const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
      // Draw a symmetrical triangle with centroid at (0,0):
      // Vertices: (-10,-10), (-10,10), (20,0)
      graphics.fillStyle(0x00ffff, 1); // neon cyan
      graphics.beginPath();
      graphics.moveTo(-10, -10);
      graphics.lineTo(-10, 10);
      graphics.lineTo(20, 0);
      graphics.closePath();
      graphics.fillPath();
      graphics.generateTexture("ship", 30, 20);
    }
  }
}
