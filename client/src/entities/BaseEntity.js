import Phaser from "phaser";

export default class BaseEntity extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y, texture, frame) {
    super(scene, x, y, texture, frame);
    // Add to scene and enable physics.
    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Default properties for all entities.
    this.setOrigin(0.5, 0.5);
    this.setCollideWorldBounds(true);
  }
}
