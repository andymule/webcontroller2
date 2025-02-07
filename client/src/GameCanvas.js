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
      // Receive data (including the socket) when the scene starts.
      init(data) {
        console.log("MainScene: init called with data:", data);
        this.socket = data.socket;
      }
      preload() {
        // Create a white ball texture so that tinting works correctly.
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff, 1); // Use white (0xffffff) instead of red.
        graphics.fillCircle(20, 20, 20);
        graphics.generateTexture("ball", 40, 40);
      }
      create() {
        console.log("MainScene: create called");

        // Set world bounds.
        this.physics.world.setBounds(0, 0, this.scale.width, this.scale.height);

        // Create the ball at the center.
        this.ball = this.physics.add.image(
          this.scale.width / 2,
          this.scale.height / 2,
          "ball"
        );
        this.ball.setBounce(0.9);
        this.ball.setCollideWorldBounds(true);
        // Start with zero velocity.
        this.ball.setVelocity(0, 0);
        // Apply gravity.
        this.ball.body.setGravityY(300);

        // Draw a border rectangle for visualization.
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xffffff);
        graphics.strokeRect(0, 0, this.scale.width, this.scale.height);

        // Attach socket listeners.
        if (this.socket) {
          // Listen for "launch" events from the launcher.
          this.socket.on("launch", (drag) => {
            console.log("MainScene: received launch event:", drag);
            this.applyImpulse(drag);
          });
          // Listen for "changeColor" events from the launcher.
          this.socket.on("changeColor", (color) => {
            console.log(
              "MainScene: received changeColor event. New color:",
              color
            );
            this.changeBallColor(color);
          });
          console.log("MainScene: Socket listeners attached.");
        } else {
          console.warn("MainScene: Socket is not available in scene!");
        }
      }
      update() {
        // Additional game logic can be added here.
      }
      applyImpulse(drag) {
        if (this.ball && this.ball.body) {
          console.log(
            "MainScene: Before launch, velocity:",
            this.ball.body.velocity
          );
          // Use a scaling factor to determine impulse strength.
          const factor = 5;
          const impulse = {
            x: -drag.dx * factor,
            y: -drag.dy * factor,
          };
          console.log("MainScene: Launching ball with impulse:", impulse);
          this.ball.setVelocity(impulse.x, impulse.y);
          console.log(
            "MainScene: After launch, velocity:",
            this.ball.body.velocity
          );
        } else {
          console.warn(
            "MainScene: applyImpulse called, but ball or its body is missing!"
          );
        }
      }
      changeBallColor(color) {
        if (this.ball) {
          console.log("MainScene: Changing ball color to:", color);
          // Convert the hex string (e.g. "#FF0000") to a number.
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
      width: 800,
      height: 600,
      physics: {
        default: "arcade",
        arcade: {
          gravity: { y: 300 },
          debug: false,
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600,
      },
      scene: MainScene,
    };

    console.log("GameCanvas: Creating Phaser game instance");
    gameRef.current = new Phaser.Game(config);
    console.log("GameCanvas: Starting MainScene with socket:", socket);
    gameRef.current.scene.start("MainScene", { socket: socket });

    return () => {
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
        width: "800px",
        height: "600px",
      }}
    />
  );
};

export default GameCanvas;
