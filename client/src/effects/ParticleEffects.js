// src/effects/ParticleEffects.js
export function emitCollisionParticles(scene, x, y) {
  // Ensure the particle texture exists.
  if (!scene.textures.exists("particle")) {
    const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(3, 3, 3);
    graphics.generateTexture("particle", 6, 6);
  }
  // Create an emitter using the new API; note we omit any setPosition call.
  const emitter = scene.add.particles("particle", {
    speed: { min: -200, max: 200 },
    lifespan: 500,
    scale: { start: 1, end: 0 },
    blendMode: "ADD",
    quantity: 10,
  });
  // Explode particles at the given world coordinates
  emitter.explode(10, x, y);
  scene.time.delayedCall(500, () => emitter.destroy());
}
