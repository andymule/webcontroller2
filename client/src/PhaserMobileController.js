// client/src/PhaserMobileController.js
import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const PhaserMobileController = ({ socket }) => {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    console.log("[DEBUG] useEffect called in PhaserMobileController");
    if (gameRef.current) {
      console.log(
        "[DEBUG] Phaser game already initialized. Skipping re-initialization."
      );
      return;
    }
    if (!containerRef.current) {
      console.log("[DEBUG] containerRef is not ready yet.");
      return;
    }

    class ControllerScene extends Phaser.Scene {
      constructor() {
        super("ControllerScene");
        console.log("[DEBUG] ControllerScene constructor called.");
      }
      preload() {
        console.log("[DEBUG] ControllerScene preload called.");
      }
      create() {
        console.log("[DEBUG] ControllerScene create called.");
        const { width, height } = this.sys.game.config;
        console.log("[DEBUG] Game config:", { width, height });

        // Debug text to verify the scene is running.
        const debugText = this.add.text(
          width / 2,
          height / 2,
          "Controller Scene Running",
          {
            fontSize: "24px",
            fill: "#ffffff",
          }
        );
        debugText.setOrigin(0.5);
        console.log("[DEBUG] Debug text added to scene.");

        // Draw background halves.
        const leftGraphics = this.add.graphics();
        leftGraphics.fillStyle(0xffcccc, 1);
        leftGraphics.fillRect(0, 0, width / 2, height);
        console.log("[DEBUG] Left half drawn.");
        const rightGraphics = this.add.graphics();
        rightGraphics.fillStyle(0xccccff, 1);
        rightGraphics.fillRect(width / 2, 0, width / 2, height);
        console.log("[DEBUG] Right half drawn.");

        // Settings for analog sticks.
        const stickRadius = 50;
        const knobRadius = 20;
        const maxDistance = stickRadius;
        console.log("[DEBUG] Analog stick settings:", {
          stickRadius,
          knobRadius,
          maxDistance,
        });

        // ---------- LEFT ANALOG STICK ----------
        this.leftBase = this.add.circle(
          width / 4,
          height / 2,
          stickRadius,
          0x888888,
          0.5
        );
        console.log(
          "[DEBUG] Left base circle created at",
          this.leftBase.x,
          this.leftBase.y
        );
        this.leftKnob = this.add.circle(
          this.leftBase.x,
          this.leftBase.y,
          knobRadius,
          0xffffff
        );
        console.log(
          "[DEBUG] Left knob created at",
          this.leftKnob.x,
          this.leftKnob.y
        );
        // Disable knob's own interactive behavior so events come from the entire area.
        this.leftKnob.disableInteractive();

        // ---------- RIGHT ANALOG STICK ----------
        this.rightBase = this.add.circle(
          width * 0.75,
          height / 2,
          stickRadius,
          0x888888,
          0.5
        );
        console.log(
          "[DEBUG] Right base circle created at",
          this.rightBase.x,
          this.rightBase.y
        );
        this.rightKnob = this.add.circle(
          this.rightBase.x,
          this.rightBase.y,
          knobRadius,
          0xffffff
        );
        console.log(
          "[DEBUG] Right knob created at",
          this.rightKnob.x,
          this.rightKnob.y
        );
        this.rightKnob.disableInteractive();

        // Helper functions for updating and resetting the knobs.
        const updateLeftKnob = (pointer) => {
          // Use pointer.x and pointer.y directly.
          const pos = { x: pointer.x, y: pointer.y };
          let dx = pos.x - this.leftBase.x;
          let dy = pos.y - this.leftBase.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > maxDistance) {
            const angle = Math.atan2(dy, dx);
            dx = Math.cos(angle) * maxDistance;
            dy = Math.sin(angle) * maxDistance;
          }
          this.leftKnob.x = this.leftBase.x + dx;
          this.leftKnob.y = this.leftBase.y + dy;
          const normX = dx / maxDistance;
          const normY = dy / maxDistance;
          console.log(
            "[DEBUG] Left area updated; knob at",
            this.leftKnob.x,
            this.leftKnob.y,
            "norm:",
            { normX, normY }
          );
          if (socket) {
            socket.emit("launcherUpdate", { dx: normX, dy: normY });
          }
        };

        const resetLeftKnob = () => {
          this.leftKnob.x = this.leftBase.x;
          this.leftKnob.y = this.leftBase.y;
          if (socket) {
            socket.emit("launcherUpdate", { dx: 0, dy: 0 });
          }
          console.log("[DEBUG] Left knob reset to base.");
        };

        const updateRightKnob = (pointer) => {
          const pos = { x: pointer.x, y: pointer.y };
          let dx = pos.x - this.rightBase.x;
          let dy = pos.y - this.rightBase.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > maxDistance) {
            const angle = Math.atan2(dy, dx);
            dx = Math.cos(angle) * maxDistance;
            dy = Math.sin(angle) * maxDistance;
          }
          this.rightKnob.x = this.rightBase.x + dx;
          this.rightKnob.y = this.rightBase.y + dy;
          console.log(
            "[DEBUG] Right area updated; knob at",
            this.rightKnob.x,
            this.rightKnob.y
          );
        };

        const resetRightKnob = () => {
          this.rightKnob.x = this.rightBase.x;
          this.rightKnob.y = this.rightBase.y;
          console.log("[DEBUG] Right knob reset to base.");
        };

        // ---------- Interactive Background Areas ----------
        // Create invisible interactive rectangles covering each half.
        const leftArea = this.add.rectangle(
          width / 4,
          height / 2,
          width / 2,
          height,
          0x000000,
          0
        );
        leftArea.setInteractive();
        this.leftActive = false;
        leftArea.on("pointerdown", (pointer) => {
          this.leftActive = true;
          updateLeftKnob(pointer);
        });
        leftArea.on("pointermove", (pointer) => {
          if (this.leftActive) {
            updateLeftKnob(pointer);
          }
        });
        leftArea.on("pointerup", () => {
          this.leftActive = false;
          resetLeftKnob();
        });
        leftArea.on("pointerupoutside", () => {
          this.leftActive = false;
          resetLeftKnob();
        });

        const rightArea = this.add.rectangle(
          width * 0.75,
          height / 2,
          width / 2,
          height,
          0x000000,
          0
        );
        rightArea.setInteractive();
        this.rightActive = false;
        rightArea.on("pointerdown", (pointer) => {
          this.rightActive = true;
          updateRightKnob(pointer);
        });
        rightArea.on("pointermove", (pointer) => {
          if (this.rightActive) {
            updateRightKnob(pointer);
          }
        });
        rightArea.on("pointerup", () => {
          this.rightActive = false;
          // Calculate final displacement for shooting.
          const dx = this.rightKnob.x - this.rightBase.x;
          const dy = this.rightKnob.y - this.rightBase.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 5 && socket) {
            const normX = dx / maxDistance;
            const normY = dy / maxDistance;
            console.log("[DEBUG] Right area pointerup; shooting with norm:", {
              normX,
              normY,
            });
            socket.emit("shoot", { dx: normX, dy: normY });
          } else {
            console.log(
              "[DEBUG] Right area pointerup; not enough movement to shoot."
            );
          }
          resetRightKnob();
        });
        rightArea.on("pointerupoutside", () => {
          this.rightActive = false;
          resetRightKnob();
        });

        // Bring the knob graphics to the top.
        this.children.bringToTop(this.leftKnob);
        this.children.bringToTop(this.rightKnob);

        // Enable additional pointers for multitouch.
        this.input.addPointer(2);
        console.log("[DEBUG] Additional pointers added for multitouch.");
      }
    }

    const config = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      scene: ControllerScene,
      backgroundColor: "#000000",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    console.log("[DEBUG] Creating new Phaser Game with config:", config);
    const game = new Phaser.Game(config);
    gameRef.current = game;
    console.log("[DEBUG] Phaser Game instance created:", game);

    return () => {
      console.log("[DEBUG] Cleaning up Phaser Game.");
      game.destroy(true);
    };
  }, [socket]);

  console.log("[DEBUG] Rendering container div for PhaserMobileController.");
  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
};

export default PhaserMobileController;
