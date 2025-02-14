// src/config/phaserConfig.js
import Phaser from "phaser";
import MainScene from "../scenes/MainScene";
import GlowPipeline from "../pipelines/GlowPipeline";

const buildConfig = (width, height) => ({
  type: Phaser.AUTO,
  parent: "phaser-game",
  width,
  height,
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: MainScene,
  // Register our custom pipeline.
  pipeline: { GlowPipeline: GlowPipeline },
});

export default buildConfig;
