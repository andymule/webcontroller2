// src/scenes/MainScene.js
import Phaser from "phaser";

export default class MainScene extends Phaser.Scene {
  constructor() {
    super({ key: "MainScene" });
  }
  init(data) {
    console.log("MainScene: init called with data:", data);
    this.socket = data.socket;
  }
  preload() {
    // Create a triangular ship texture.
    const shipGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    shipGraphics.fillStyle(0x00ff00, 1);
    shipGraphics.beginPath();
    shipGraphics.moveTo(30, 0);
    shipGraphics.lineTo(0, 20);
    shipGraphics.lineTo(0, -20);
    shipGraphics.closePath();
    shipGraphics.fillPath();
    shipGraphics.generateTexture("ship", 30, 40);

    // Create a bullet texture (a small white circle).
    const bulletGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    bulletGraphics.fillStyle(0xffffff, 1);
    bulletGraphics.fillCircle(5, 5, 5);
    bulletGraphics.generateTexture("bullet", 10, 10);

    // Create an enemy texture (a red circle).
    const enemyGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    enemyGraphics.fillStyle(0xff0000, 1);
    enemyGraphics.fillCircle(15, 15, 15);
    enemyGraphics.generateTexture("enemy", 30, 30);
  }
  create() {
    console.log("MainScene: create called");

    // Create groups for bullets and enemies.
    this.bullets = this.physics.add.group();
    this.enemies = this.physics.add.group();

    // Dictionary to track players (keyed by socket id).
    this.players = {};

    // Set world bounds.
    this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

    // Optional border for visualization.
    const borderGraphics = this.add.graphics();
    borderGraphics.lineStyle(4, 0xffffff);
    borderGraphics.strokeRect(0, 0, this.scale.width, this.scale.height);

    // --- Socket Event Listeners ---
    this.socket.on("launcherUpdate", (data) => {
      // Data includes { id, dx, dy }
      if (!this.players[data.id]) {
        const ship = this.physics.add.image(
          this.scale.width / 2,
          this.scale.height / 2,
          "ship"
        );
        ship.setCollideWorldBounds(true);
        ship.setDamping(true);
        ship.setDrag(0.9);
        ship.setMaxVelocity(300);
        this.players[data.id] = ship;

        this.physics.add.overlap(ship, this.enemies, (ship, enemy) => {
          ship.destroy();
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

    // Apply the custom glow pipeline to the main camera.
    this.cameras.main.setPostPipeline("GlowPipeline");
  }
  update() {
    // Additional game logic can be added here.
  }
  shootBullet(shooter, data) {
    const bulletSpeed = 400;
    let magnitude = Math.sqrt(data.dx * data.dx + data.dy * data.dy);
    if (magnitude < 0.001) {
      data.dx = Math.cos(shooter.rotation);
      data.dy = Math.sin(shooter.rotation);
      magnitude = 1;
    }
    const normX = data.dx / magnitude;
    const normY = data.dy / magnitude;
    const bullet = this.physics.add.image(shooter.x, shooter.y, "bullet");
    this.bullets.add(bullet);
    bullet.setCollideWorldBounds(true);
    bullet.body.onWorldBounds = true;
    bullet.setVelocity(normX * bulletSpeed, normY * bulletSpeed);
    console.log(
      "MainScene: Bullet shot with velocity:",
      normX * bulletSpeed,
      normY * bulletSpeed
    );
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
    const enemy = this.physics.add.image(x, y, "enemy");
    enemy.setCollideWorldBounds(true);
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
