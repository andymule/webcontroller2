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
        // Create a ball texture.
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0x555555, 1);
        graphics.fillCircle(20, 20, 20);
        graphics.fillStyle(0xdddddd, 1);
        graphics.beginPath();
        graphics.arc(
          20,
          20,
          20,
          Phaser.Math.DegToRad(45),
          Phaser.Math.DegToRad(225),
          false
        );
        graphics.lineTo(20, 20);
        graphics.closePath();
        graphics.fillPath();
        graphics.generateTexture("ball", 40, 40);

        // Create a bullet texture (a small white circle).
        const bulletGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        bulletGraphics.fillStyle(0xffffff, 1);
        bulletGraphics.fillCircle(5, 5, 5);
        bulletGraphics.generateTexture("bullet", 10, 10);
      }
      create() {
        console.log("MainScene: create called");
        // Use current window dimensions.
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

        // Create the ball at the center.
        this.ball = this.physics.add.image(
          this.scale.width / 2,
          this.scale.height / 2,
          "ball"
        );
        this.ball.setBounce(0.9);
        this.ball.setCollideWorldBounds(true);
        this.ball.setVelocity(0, 0);

        // Draw border for visualization.
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xffffff);
        graphics.strokeRect(0, 0, this.scale.width, this.scale.height);

        // Listen for movement events.
        if (this.socket) {
          this.socket.on("launcherUpdate", (move) => {
            const movefactor = 250;
            this.ball.setVelocity(move.dx * movefactor, move.dy * movefactor);
            console.log("MainScene: launcherUpdate received:", move);
          });

          // Listen for shoot events.
          this.socket.on("shoot", (data) => {
            console.log("MainScene: shoot received:", data);
            this.shootBullet(data);
          });
          console.log("MainScene: Socket listeners attached.");
        } else {
          console.warn("MainScene: Socket is not available in scene!");
        }
      }
      update() {
        // Additional game logic can be added here.
      }
      shootBullet(data) {
        // data.dx, data.dy are normalized direction components from the controller.
        const bulletSpeed = 400.0;
        // Create bullet at the ball's current position.
        const bullet = this.physics.add.image(
          this.ball.x,
          this.ball.y,
          "bullet"
        );
        // Get the current velocity of the ship.
        const currentV = this.ball.body.velocity;
        // Flip the direction (reverse the flick) and add ship's current velocity.
        const bulletVx = currentV.x - data.dx * bulletSpeed;
        const bulletVy = currentV.y - data.dy * bulletSpeed;
        bullet.setVelocity(bulletVx, bulletVy);
        console.log("MainScene: Bullet velocity:", bulletVx, bulletVy);
        // Destroy the bullet after 1 second.
        this.time.addEvent({
          delay: 1000,
          callback: () => {
            bullet.destroy();
          },
        });
      }
      changeBallColor(color) {
        if (this.ball) {
          console.log("MainScene: Changing ball color to:", color);
          const colorNum = parseInt(color.replace("#", ""), 16);
          this.ball.setTint(colorNum);
        } else {
          console.warn(
            "MainScene: changeBallColor called, but ball is missing!"
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
