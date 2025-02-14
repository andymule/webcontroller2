import Phaser from "phaser";
import Ship from "../entities/Ship";
import Bullet from "../entities/Bullet";
import Enemy from "../entities/Enemy";
import { emitCollisionParticles } from "../effects/ParticleEffects";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }
  init(data) {
    console.log("MainScene: init called with data:", data);
    this.socket = data.socket;
    this.players = {};
  }
  preload() {
    // No need to include the graphics calls here since each entity handles its own texture.
  }
  create() {
    console.log("MainScene: create called");
    this.bullets = this.physics.add.group();
    this.enemies = this.physics.add.group();
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    // Optional border for visualization.
    const borderGraphics = this.add.graphics();
    borderGraphics.lineStyle(4, 0xffffff);
    borderGraphics.strokeRect(0, 0, this.scale.width, this.scale.height);

    // --- Socket Event Listeners ---
    this.socket.on("launcherUpdate", (data) => {
      if (!this.players[data.id]) {
        const ship = new Ship(
          this,
          this.scale.width / 2,
          this.scale.height / 2
        );
        this.players[data.id] = ship;
        this.physics.add.overlap(ship, this.enemies, (shipObj, enemy) => {
          emitCollisionParticles(this, shipObj.x, shipObj.y);
          shipObj.destroy();
          delete this.players[data.id];
          console.log(`MainScene: Player ${data.id} was destroyed by an enemy`);
        });
      }
      const playerShip = this.players[data.id];
      const moveFactor = 250;
      playerShip.setVelocity(data.dx * moveFactor, data.dy * moveFactor);
      const velocity = playerShip.body.velocity;
      if (velocity.length() > 0) {
        playerShip.setRotation(Math.atan2(velocity.y, velocity.x));
      }
    });

    this.socket.on("shoot", (data) => {
      const shooter = this.players[data.id];
      if (!shooter) return;
      this.shootBullet(shooter, data);
    });

    this.socket.on("playerDisconnected", (id) => {
      if (this.players[id]) {
        this.players[id].destroy();
        delete this.players[id];
        console.log("MainScene: Removed player", id);
      }
    });

    this.physics.add.overlap(this.bullets, this.enemies, (bullet, enemy) => {
      bullet.destroy();
      enemy.destroy();
      emitCollisionParticles(this, enemy.x, enemy.y);
      console.log("MainScene: Enemy hit by bullet");
    });

    this.physics.world.on("worldbounds", (body) => {
      if (body.gameObject && body.gameObject.texture.key === "bullet") {
        body.gameObject.destroy();
      }
    });

    this.time.addEvent({
      delay: 2000,
      callback: this.spawnEnemy,
      callbackScope: this,
      loop: true,
    });

    this.cameras.main.setPostPipeline("GlowPipeline");
  }
  update() {
    // Let Bullet objects update themselves (if using the class that overrides preUpdate)
  }
  shootBullet(shooter, data) {
    const bulletSpeed = 400;
    let magnitude = Math.sqrt(data.dx * data.dx + data.dy * data.dy);
    // Fallback to shoot in the direction the shooter is facing.
    if (magnitude < 0.001) {
      const rot = shooter.rotation || 0;
      data.dx = Math.cos(rot);
      data.dy = Math.sin(rot);
      magnitude = 1;
    }
    const normX = data.dx / magnitude;
    const normY = data.dy / magnitude;
    console.log(
      "MainScene: Bullet shot with velocity:",
      normX * bulletSpeed,
      normY * bulletSpeed
    );
    // Create bullet using physics.add.image (this worked in your original refactor)
    const bullet = this.physics.add.image(shooter.x, shooter.y, "bullet");
    bullet.setOrigin(0.5, 0.5);
    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;
    bullet.setVelocity(normX * bulletSpeed, normY * bulletSpeed);
    this.bullets.add(bullet);
    this.time.addEvent({
      delay: 10000,
      callback: () => {
        if (bullet && bullet.destroy) bullet.destroy();
      },
    });
  }

  spawnEnemy() {
    const side = Phaser.Math.Between(0, 3);
    let x, y;
    if (side === 0) {
      x = Phaser.Math.Between(0, this.scale.width);
      y = 0;
    } else if (side === 1) {
      x = this.scale.width;
      y = Phaser.Math.Between(0, this.scale.height);
    } else if (side === 2) {
      x = Phaser.Math.Between(0, this.scale.width);
      y = this.scale.height;
    } else {
      x = 0;
      y = Phaser.Math.Between(0, this.scale.height);
    }
    const enemy = new Enemy(this, x, y);
    this.enemies.add(enemy);
    let nearest = null;
    let minDist = Infinity;
    Object.values(this.players).forEach((player) => {
      const dist = Phaser.Math.Distance.Between(player.x, player.y, x, y);
      if (dist < minDist) {
        minDist = dist;
        nearest = player;
      }
    });
    if (nearest) {
      this.physics.moveToObject(enemy, nearest, 100);
    } else {
      enemy.setVelocity(
        Phaser.Math.Between(-100, 100),
        Phaser.Math.Between(-100, 100)
      );
    }
  }
}
