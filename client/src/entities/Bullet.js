// src/entities/Bullet.js
import BaseEntity from "./BaseEntity";

export default class Bullet extends BaseEntity {
  constructor(scene, x, y, velocityX, velocityY) {
    Bullet.ensureTexture(scene);
    super(scene, x, y, "bullet");
    this.setVelocity(velocityX, velocityY);
  }

  static ensureTexture(scene) {
    if (!scene.textures.exists("bullet")) {
      const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0xff00ff, 1); // neon magenta
      graphics.fillRect(0, 0, 10, 10);
      graphics.generateTexture("bullet", 10, 10);
    }
  }

  preUpdate(time, delta) {
    // Removed the call to super.preUpdate since it doesn't exist.
    this.angle += 5; // rotate bullet for visual effect
  }
}
