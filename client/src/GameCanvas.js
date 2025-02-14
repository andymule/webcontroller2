// client/src/GameCanvas.js
import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const GameCanvas = ({ socket }) => {
  const gameRef = useRef(null);

  useEffect(() => {
    if (!socket) {
      console.warn("GameCanvas: No socket provided yet.");
      return;
    }
    if (gameRef.current) return; // Only initialize once

    class MainScene extends Phaser.Scene {
      constructor() {
        super({ key: "MainScene" });
      }
      init(data) {
        console.log("MainScene: init called with data:", data);
        this.socket = data.socket;
      }
      preload() {
        // Create a triangular ship texture (Geometry Wars–style ship).
        const shipGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        shipGraphics.fillStyle(0x00ff00, 1);
        // Draw a triangle pointing to the right.
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

        // Groups for bullets and enemies.
        this.bullets = this.physics.add.group();
        this.enemies = this.physics.add.group();

        // Dictionary to keep track of players (keyed by socket id).
        this.players = {};

        // Set world bounds (using the canvas view's maximum size).
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

        // Draw border for visualization.
        const borderGraphics = this.add.graphics();
        borderGraphics.lineStyle(4, 0xffffff);
        borderGraphics.strokeRect(0, 0, this.scale.width, this.scale.height);

        // --- Socket Event Listeners ---

        // When a mobile controller sends movement data.
        this.socket.on("launcherUpdate", (data) => {
          // Data includes { id, dx, dy }
          // If player doesn't exist yet, create a new ship for them.
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

            // Add collision between enemy and this new ship.
            this.physics.add.overlap(ship, this.enemies, (ship, enemy) => {
              // On collision, "kill" the player.
              ship.destroy();
              delete this.players[data.id];
              console.log(
                `MainScene: Player ${data.id} was destroyed by an enemy`
              );
            });
          }
          const playerShip = this.players[data.id];
          const moveFactor = 250;
          // Update velocity based on input.
          playerShip.setVelocity(data.dx * moveFactor, data.dy * moveFactor);
          // Rotate ship to face movement direction (if moving).
          const velocity = playerShip.body.velocity;
          if (velocity.length() > 0) {
            playerShip.setRotation(Math.atan2(velocity.y, velocity.x));
          }
        });

        // When a mobile controller sends a shoot event.
        this.socket.on("shoot", (data) => {
          // Data includes { id, dx, dy }
          const shooter = this.players[data.id];
          if (!shooter) return;
          this.shootBullet(shooter, data);
        });

        // When a player disconnects.
        this.socket.on("playerDisconnected", (id) => {
          if (this.players[id]) {
            this.players[id].destroy();
            delete this.players[id];
            console.log("MainScene: Removed player", id);
          }
        });

        // Collision between bullets and enemies.
        this.physics.add.overlap(
          this.bullets,
          this.enemies,
          (bullet, enemy) => {
            bullet.destroy();
            enemy.destroy();
            console.log("MainScene: Enemy hit by bullet");
          }
        );

        // Destroy bullets when they hit world bounds.
        this.physics.world.on("worldbounds", (body) => {
          if (body.gameObject && body.gameObject.texture.key === "bullet") {
            body.gameObject.destroy();
          }
        });

        // Spawn enemies periodically.
        this.time.addEvent({
          delay: 2000,
          callback: this.spawnEnemy,
          callbackScope: this,
          loop: true,
        });
      }
      update() {
        // Additional game logic can be added here.
      }
      shootBullet(shooter, data) {
        const bulletSpeed = 400;

        // Compute the magnitude of the input direction vector.
        let magnitude = Math.sqrt(data.dx * data.dx + data.dy * data.dy);

        // If magnitude is 0 (or nearly 0), fall back to the shooter’s facing.
        if (magnitude < 0.001) {
          data.dx = Math.cos(shooter.rotation);
          data.dy = Math.sin(shooter.rotation);
          magnitude = 1; // now normalized
        }

        // Normalize the direction.
        const normX = data.dx / magnitude;
        const normY = data.dy / magnitude;

        // Create the bullet at the shooter’s position.
		  const bullet = this.physics.add.image(shooter.x, shooter.y, "bullet");
		  this.bullets.add(bullet);
        bullet.setCollideWorldBounds(true);
        bullet.body.onWorldBounds = true;

        // Now apply velocity using the normalized vector.
		bullet.setVelocity(normX * bulletSpeed, normY * bulletSpeed);
		//   bullet.setVelocity(50000, 0);
        

        console.log(
          "MainScene: Bullet shot with velocity:",
          normX * bulletSpeed,
          normY * bulletSpeed
        );

        // Remove bullet after 10 seconds as a failsafe.
        this.time.addEvent({
          delay: 10000,
          callback: () => {
            if (bullet && bullet.destroy) bullet.destroy();
          },
        });
      }

      spawnEnemy() {
        // Spawn enemy from a random border.
        const side = Phaser.Math.Between(0, 3); // 0: top, 1: right, 2: bottom, 3: left.
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

        // Find nearest player.
        let nearest = null;
        let minDist = Infinity;
        Object.values(this.players).forEach((player) => {
          const dist = Phaser.Math.Distance.Between(player.x, player.y, x, y);
          if (dist < minDist) {
            minDist = dist;
            nearest = player;
          }
        });
        // Set velocity toward the nearest player if exists.
        if (nearest) {
          this.physics.moveToObject(enemy, nearest, 100);
        } else {
          // Otherwise, move in a random direction.
          enemy.setVelocity(
            Phaser.Math.Between(-100, 100),
            Phaser.Math.Between(-100, 100)
          );
        }
      }
    }

    const config = {
      type: Phaser.AUTO,
      parent: "phaser-game",
      width: window.innerWidth,
      height: window.innerHeight,
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
    };

    console.log("GameCanvas: Creating Phaser game instance");
    gameRef.current = new Phaser.Game(config);
    console.log("GameCanvas: Starting MainScene with socket:", socket);
    gameRef.current.scene.start("MainScene", { socket: socket });

    // Listen for window resize events.
    const resizeListener = () => {
      if (gameRef.current && gameRef.current.scale) {
        gameRef.current.scale.resize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener("resize", resizeListener);

    return () => {
      window.removeEventListener("resize", resizeListener);
      if (gameRef.current) {
        console.log("GameCanvas: Destroying Phaser game instance");
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [socket]);

  return (
    <div
      id="phaser-game"
      style={{
        margin: "0 auto",
        border: "2px solid #fff",
        width: "100%",
        height: "100vh",
      }}
    />
  );
};

export default GameCanvas;
