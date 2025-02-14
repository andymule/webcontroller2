import BaseEntity from "./BaseEntity";

export default class Enemy extends BaseEntity {
  constructor(scene, x, y) {
    Enemy.ensureTexture(scene);
    super(scene, x, y, "enemy");
  }

  static ensureTexture(scene) {
    if (!scene.textures.exists("enemy")) {
      const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0xff3300, 1);
      graphics.fillCircle(15, 15, 15);
      graphics.generateTexture("enemy", 30, 30);
    }
  }
}
