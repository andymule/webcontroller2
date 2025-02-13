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

        // Draw background halves.
        this.leftGraphics = this.add.graphics();
        this.leftGraphics.fillStyle(0xffcccc, 1);
        this.leftGraphics.fillRect(0, 0, width / 2, height);
        this.rightGraphics = this.add.graphics();
        this.rightGraphics.fillStyle(0xccccff, 1);
        this.rightGraphics.fillRect(width / 2, 0, width / 2, height);

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
        this.leftKnob = this.add.circle(
          this.leftBase.x,
          this.leftBase.y,
          knobRadius,
          0xffffff
        );
        // Disable knob's own interactive behavior so events come from the full left half.
        this.leftKnob.disableInteractive();

        // ---------- RIGHT ANALOG STICK ----------
        this.rightBase = this.add.circle(
          (width * 3) / 4,
          height / 2,
          stickRadius,
          0x888888,
          0.5
        );
        this.rightKnob = this.add.circle(
          this.rightBase.x,
          this.rightBase.y,
          knobRadius,
          0xffffff
        );
        this.rightKnob.disableInteractive();

        // Helper functions for updating and resetting the knobs.
        const updateLeftKnob = (pointer) => {
          const pos = { x: pointer.x, y: pointer.y };
          let dx = pos.x - this.leftBase.x;
          let dy = pos.y - this.leftBase.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > maxDistance) {
            const angle = Math.atan2(dy, dx);
            dx = Math.cos(angle) * maxDistance;
            dy = Math.sin(angle) * maxDistance;
          }
          this.leftKnob.setPosition(this.leftBase.x + dx, this.leftBase.y + dy);
          const normX = dx / maxDistance;
          const normY = dy / maxDistance;
          if (socket) {
            socket.emit("launcherUpdate", { dx: normX, dy: normY });
          }
        };

        const resetLeftKnob = () => {
          this.leftKnob.setPosition(this.leftBase.x, this.leftBase.y);
          if (socket) {
            socket.emit("launcherUpdate", { dx: 0, dy: 0 });
          }
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
          this.rightKnob.setPosition(
            this.rightBase.x + dx,
            this.rightBase.y + dy
          );
        };

        const resetRightKnob = () => {
          this.rightKnob.setPosition(this.rightBase.x, this.rightBase.y);
        };

        // ---------- Interactive Background Areas ----------
        // Create invisible interactive rectangles covering each half.
        this.leftArea = this.add.rectangle(
          width / 4,
          height / 2,
          width / 2,
          height,
          0x000000,
          0
        );
        this.leftArea.setInteractive();
        this.leftActive = false;
        this.leftArea.on("pointerdown", (pointer) => {
          this.leftActive = true;
          updateLeftKnob(pointer);
        });
        this.leftArea.on("pointermove", (pointer) => {
          if (this.leftActive) {
            updateLeftKnob(pointer);
          }
        });
        this.leftArea.on("pointerup", () => {
          this.leftActive = false;
          resetLeftKnob();
        });
        this.leftArea.on("pointerupoutside", () => {
          this.leftActive = false;
          resetLeftKnob();
        });

        this.rightArea = this.add.rectangle(
          (width * 3) / 4,
          height / 2,
          width / 2,
          height,
          0x000000,
          0
        );
        this.rightArea.setInteractive();
        this.rightActive = false;
        this.rightArea.on("pointerdown", (pointer) => {
          this.rightActive = true;
          updateRightKnob(pointer);
        });
        this.rightArea.on("pointermove", (pointer) => {
          if (this.rightActive) {
            updateRightKnob(pointer);
          }
        });
        this.rightArea.on("pointerup", () => {
          this.rightActive = false;
          // Calculate final displacement for shooting.
          const dx = this.rightKnob.x - this.rightBase.x;
          const dy = this.rightKnob.y - this.rightBase.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 5 && socket) {
            const normX = dx / maxDistance;
            const normY = dy / maxDistance;
            socket.emit("shoot", { dx: normX, dy: normY });
          }
          resetRightKnob();
        });
        this.rightArea.on("pointerupoutside", () => {
          this.rightActive = false;
          resetRightKnob();
        });

        // Bring the knob graphics to the top.
        this.children.bringToTop(this.leftKnob);
        this.children.bringToTop(this.rightKnob);

        // Enable additional pointers for multitouch.
        this.input.addPointer(2);
        console.log("[DEBUG] Additional pointers added for multitouch.");

        // Listen for Phaser's resize event and update UI positions.
        this.scale.on("resize", (gameSize) => {
          const newWidth = gameSize.width;
          const newHeight = gameSize.height;
          // Update base positions.
          this.leftBase.setPosition(newWidth / 4, newHeight / 2);
          this.rightBase.setPosition((newWidth * 3) / 4, newHeight / 2);
          // Reset knob positions.
          this.leftKnob.setPosition(newWidth / 4, newHeight / 2);
          this.rightKnob.setPosition((newWidth * 3) / 4, newHeight / 2);
          // Update interactive areas.
          this.leftArea.setPosition(newWidth / 4, newHeight / 2);
          this.leftArea.width = newWidth / 2;
          this.leftArea.height = newHeight;
          this.rightArea.setPosition((newWidth * 3) / 4, newHeight / 2);
          this.rightArea.width = newWidth / 2;
          this.rightArea.height = newHeight;
          // Redraw background halves.
          this.leftGraphics.clear();
          this.leftGraphics.fillStyle(0xffcccc, 1);
          this.leftGraphics.fillRect(0, 0, newWidth / 2, newHeight);
          this.rightGraphics.clear();
          this.rightGraphics.fillStyle(0xccccff, 1);
          this.rightGraphics.fillRect(newWidth / 2, 0, newWidth / 2, newHeight);
        });
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

    // Listen for window resize and orientation change events.
    const resizeListener = () => {
      if (gameRef.current && gameRef.current.scale) {
        const newWidth = document.documentElement.clientWidth;
        const newHeight = document.documentElement.clientHeight;
        gameRef.current.scale.resize(newWidth, newHeight);
      }
    };
    window.addEventListener("resize", resizeListener);
    window.addEventListener("orientationchange", resizeListener);

    return () => {
      window.removeEventListener("resize", resizeListener);
      window.removeEventListener("orientationchange", resizeListener);
      console.log("[DEBUG] Cleaning up Phaser Game.");
      game.destroy(true);
    };
  }, [socket]);

  console.log("[DEBUG] Rendering container div for PhaserMobileController.");
  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    />
  );
};

export default PhaserMobileController;
