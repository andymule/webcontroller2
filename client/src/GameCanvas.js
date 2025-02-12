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
        // Create a ball texture with a creative aesthetic that shows front/back.
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        // Draw the back of the ball (darker shade)
        graphics.fillStyle(0x555555, 1);
        graphics.fillCircle(20, 20, 20);
        // Draw the front half (lighter shade) to simulate a light source
        graphics.fillStyle(0xdddddd, 1);
        graphics.beginPath();
        // Draw an arc from 45° to 225° (in radians) to represent the illuminated front.
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
        // Note: Gravity is disabled in the physics config, so we do not apply it here.

        // Draw a border rectangle for visualization.
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0xffffff);
        graphics.strokeRect(0, 0, this.scale.width, this.scale.height);

        // Attach socket listeners.
        if (this.socket) {
          // Listen for continuous "launcherUpdate" events from the Move stick.
          this.socket.on("launcherUpdate", (move) => {
            // move contains dx and dy from the left stick movement.
            // Apply a scaling factor (adjust as needed) and set the ball's velocity.
            const factor = 5;
            this.ball.setVelocity(move.dx * factor, move.dy * factor);
            console.log("MainScene: launcherUpdate received:", move);
          });
          // Listen for "changeColor" events (triggered by the right stick).
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
      /* 
      // The launch impulse functionality is no longer used.
      applyImpulse(drag) {
        if (this.ball && this.ball.body) {
          console.log("MainScene: Before launch, velocity:", this.ball.body.velocity);
          const factor = 5;
          const impulse = {
            x: -drag.dx * factor,
            y: -drag.dy * factor,
          };
          console.log("MainScene: Launching ball with impulse:", impulse);
          this.ball.setVelocity(impulse.x, impulse.y);
          console.log("MainScene: After launch, velocity:", this.ball.body.velocity);
        } else {
          console.warn("MainScene: applyImpulse called, but ball or its body is missing!");
        }
      }
      */
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
          gravity: { y: 0 }, // Disable gravity
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
