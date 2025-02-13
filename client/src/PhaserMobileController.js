import React, { useEffect, useRef } from "react";
import Phaser from "phaser";

const PhaserMobileController = ({ socket }) => {
  const containerRef = useRef(null);
  const gameRef = useRef(null);

  useEffect(() => {
    console.log("[DEBUG] useEffect called in PhaserMobileController");
    if (gameRef.current) {
      console.log("[DEBUG] Phaser game already initialized. Skipping re-initialization.");
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
        const debugText = this.add.text(width / 2, height / 2, "Controller Scene Running", {
          fontSize: "24px",
          fill: "#ffffff"
        });
        debugText.setOrigin(0.5);
        console.log("[DEBUG] Debug text added to scene.");

        // Draw background halves.
        const graphics = this.add.graphics();
        console.log("[DEBUG] Graphics object created.");
        // Left half: light red.
        graphics.fillStyle(0xffcccc, 1);
        graphics.fillRect(0, 0, width / 2, height);
        console.log("[DEBUG] Left half drawn.");
        // Right half: light blue.
        graphics.fillStyle(0xccccff, 1);
        graphics.fillRect(width / 2, 0, width / 2, height);
        console.log("[DEBUG] Right half drawn.");

        // Settings for analog sticks.
        const stickRadius = 50;
        const knobRadius = 20;
        const maxDistance = stickRadius;
        console.log("[DEBUG] Analog stick settings:", { stickRadius, knobRadius, maxDistance });

        // Center analog sticks vertically (use height/2)
        // ---------- LEFT ANALOG STICK ----------
        this.leftBase = this.add.circle(width / 4, height / 2, stickRadius, 0x888888, 0.5);
        console.log("[DEBUG] Left base circle created at", this.leftBase.x, this.leftBase.y);
        this.leftKnob = this.add.circle(this.leftBase.x, this.leftBase.y, knobRadius, 0xffffff);
        console.log("[DEBUG] Left knob created at", this.leftKnob.x, this.leftKnob.y);
        this.leftKnob.setInteractive({ draggable: true });
        console.log("[DEBUG] Left knob set interactive.");
        this.leftKnob.on("drag", (pointer, dragX, dragY) => {
          let dx = dragX - this.leftBase.x;
          let dy = dragY - this.leftBase.y;
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
          console.log("[DEBUG] Left knob dragged to", this.leftKnob.x, this.leftKnob.y, "norm:", { normX, normY });
          if (socket) {
            socket.emit("launcherUpdate", { dx: normX, dy: normY });
          }
        });
        this.leftKnob.on("dragend", () => {
          this.leftKnob.x = this.leftBase.x;
          this.leftKnob.y = this.leftBase.y;
          console.log("[DEBUG] Left knob dragend; reset to", this.leftBase.x, this.leftBase.y);
          // Emit zero movement when released.
          if (socket) {
            socket.emit("launcherUpdate", { dx: 0, dy: 0 });
          }
        });

        // ---------- RIGHT ANALOG STICK ----------
        this.rightBase = this.add.circle(width * 0.75, height / 2, stickRadius, 0x888888, 0.5);
        console.log("[DEBUG] Right base circle created at", this.rightBase.x, this.rightBase.y);
        this.rightKnob = this.add.circle(this.rightBase.x, this.rightBase.y, knobRadius, 0xffffff);
        console.log("[DEBUG] Right knob created at", this.rightKnob.x, this.rightKnob.y);
        this.rightKnob.setInteractive({ draggable: true });
        console.log("[DEBUG] Right knob set interactive.");
        // We don’t emit during drag for shooting; we just update position.
        this.rightKnob.on("drag", (pointer, dragX, dragY) => {
          let dx = dragX - this.rightBase.x;
          let dy = dragY - this.rightBase.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > maxDistance) {
            const angle = Math.atan2(dy, dx);
            dx = Math.cos(angle) * maxDistance;
            dy = Math.sin(angle) * maxDistance;
          }
          this.rightKnob.x = this.rightBase.x + dx;
          this.rightKnob.y = this.rightBase.y + dy;
          console.log("[DEBUG] Right knob dragged to", this.rightKnob.x, this.rightKnob.y);
        });
        this.rightKnob.on("dragend", () => {
          // Calculate final displacement from the base.
          const dx = this.rightKnob.x - this.rightBase.x;
          const dy = this.rightKnob.y - this.rightBase.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance > 5 && socket) { // Only shoot if the knob moved significantly
            const normX = dx / maxDistance;
            const normY = dy / maxDistance;
            console.log("[DEBUG] Right knob dragend; shooting with norm:", { normX, normY });
            socket.emit("shoot", { dx: normX, dy: normY });
          } else {
            console.log("[DEBUG] Right knob dragend; not enough movement to shoot.");
          }
          // Reset knob to base position.
          this.rightKnob.x = this.rightBase.x;
          this.rightKnob.y = this.rightBase.y;
        });

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
