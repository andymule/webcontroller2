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
        this.lastShootDirection = { dx: 1, dy: 0 }; // default to firing right
        // Added pointer id tracking for each side.
        this.leftPointerId = null;
        this.rightPointerId = null;
      }
      preload() {
        console.log("[DEBUG] ControllerScene preload called.");
      }
      create() {
        console.log("[DEBUG] ControllerScene create called.");
        const { width, height } = this.sys.game.config;
        console.log("[DEBUG] Game config:", { width, height });

        // --- Reposition Analog Sticks to Bottom Third ---
        // Instead of centering vertically (height/2), we center in the bottom 1/3.
        // For example, using the center of the bottom third:
        const centerY = height * (5 / 6); // roughly center in bottom 1/3

        // Draw background halves.
        this.leftGraphics = this.add.graphics();
        this.leftGraphics.fillStyle(0xffcccc, 1);
        this.leftGraphics.fillRect(0, height * (2 / 3), width / 2, height / 3);
        this.rightGraphics = this.add.graphics();
        this.rightGraphics.fillStyle(0xccccff, 1);
        this.rightGraphics.fillRect(
          width / 2,
          height * (2 / 3),
          width / 2,
          height / 3
        );

        // Settings for analog sticks.
        const stickRadius = 50;
        const knobRadius = 20;
        const maxDistance = stickRadius;
        console.log("[DEBUG] Analog stick settings:", {
          stickRadius,
          knobRadius,
          maxDistance,
        });

        // ---------- LEFT ANALOG STICK (for movement) ----------
        this.leftBase = this.add.circle(
          width / 4,
          centerY, // moved to bottom third
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
        this.leftKnob.disableInteractive();

        // ---------- RIGHT ANALOG STICK (for shooting) ----------
        this.rightBase = this.add.circle(
          (width * 3) / 4,
          centerY, // moved to bottom third
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

        // Rapid-fire timer for auto-shooting.
        this.shootingTimer = null;

        // Helper functions.
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
            socket.emit("launcherUpdate", {
              id: socket.id,
              dx: normX,
              dy: normY,
            });
          }
        };

        const resetLeftKnob = () => {
          this.leftKnob.setPosition(this.leftBase.x, this.leftBase.y);
          if (socket) {
            socket.emit("launcherUpdate", { id: socket.id, dx: 0, dy: 0 });
          }
          this.leftPointerId = null; // clear pointer id when released
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
          // Calculate normalized direction.
          const norm = { dx: dx / maxDistance, dy: dy / maxDistance };
          // If the displacement is significant, store this as the last shoot direction.
          if (Math.abs(norm.dx) > 0.1 || Math.abs(norm.dy) > 0.1) {
            this.lastShootDirection = norm;
          }
          return this.lastShootDirection;
        };

        const resetRightKnob = () => {
          this.rightKnob.setPosition(this.rightBase.x, this.rightBase.y);
          this.rightPointerId = null; // clear pointer id when released
        };

        // ---------- Interactive Background Areas ----------
        // Limit interactive zones to the bottom third.
        // Left area for movement.
        this.leftArea = this.add.rectangle(
          width / 4,
          centerY,
          width / 2,
          height / 3,
          0x000000,
          0
        );
        this.leftArea.setInteractive();
        this.leftArea.on("pointerdown", (pointer) => {
          // Only start tracking if not already tracking another pointer
          if (this.leftPointerId === null) {
            this.leftPointerId = pointer.id;
            updateLeftKnob(pointer);
          }
        });
        this.leftArea.on("pointermove", (pointer) => {
          // Only update if this pointer is the one we started with
          if (pointer.id === this.leftPointerId) {
            updateLeftKnob(pointer);
          }
        });
        this.leftArea.on("pointerup", (pointer) => {
          if (pointer.id === this.leftPointerId) {
            resetLeftKnob();
          }
        });
        this.leftArea.on("pointerupoutside", (pointer) => {
          if (pointer.id === this.leftPointerId) {
            resetLeftKnob();
          }
        });

        // Right area for shooting.
        this.rightArea = this.add.rectangle(
          (width * 3) / 4,
          centerY,
          width / 2,
          height / 3,
          0x000000,
          0
        );
        this.rightArea.setInteractive();
        this.rightArea.on("pointerdown", (pointer) => {
          // Only start tracking if not already tracking a pointer for shooting.
          if (this.rightPointerId === null) {
            this.rightPointerId = pointer.id;
            // Fire one shot immediately.
            const { dx, dy } = updateRightKnob(pointer);
            if (socket) {
              socket.emit("shoot", { id: socket.id, dx, dy });
            }
            // Start auto-fire timer every 200ms.
            if (!this.shootingTimer) {
              this.shootingTimer = this.time.addEvent({
                delay: 200,
                loop: true,
                callback: () => {
                  // Use the stored pointer for shooting if still active.
                  const pointer =
                    this.input.pointer1.id === this.rightPointerId
                      ? this.input.pointer1
                      : this.input.pointer2; // adjust if you expect more pointers
                  if (pointer && pointer.isDown) {
                    const { dx, dy } = updateRightKnob(pointer);
                    if (socket) {
                      socket.emit("shoot", { id: socket.id, dx, dy });
                    }
                  }
                },
              });
            }
          }
        });
        this.rightArea.on("pointermove", (pointer) => {
          if (pointer.id === this.rightPointerId) {
            updateRightKnob(pointer);
          }
        });
        this.rightArea.on("pointerup", (pointer) => {
          if (pointer.id === this.rightPointerId) {
            if (this.shootingTimer) {
              this.shootingTimer.remove();
              this.shootingTimer = null;
            }
            resetRightKnob();
          }
        });
        this.rightArea.on("pointerupoutside", (pointer) => {
          if (pointer.id === this.rightPointerId) {
            if (this.shootingTimer) {
              this.shootingTimer.remove();
              this.shootingTimer = null;
            }
            resetRightKnob();
          }
        });

        // Bring the knobs to the top.
        this.children.bringToTop(this.leftKnob);
        this.children.bringToTop(this.rightKnob);

        // Enable additional pointers for multitouch.
        this.input.addPointer(2);
        console.log("[DEBUG] Additional pointers added for multitouch.");

        // Listen for resize events.
        this.scale.on("resize", (gameSize) => {
          const newWidth = gameSize.width;
          const newHeight = gameSize.height;
          const newCenterY = newHeight * (5 / 6);
          this.leftBase.setPosition(newWidth / 4, newCenterY);
          this.rightBase.setPosition((newWidth * 3) / 4, newCenterY);
          this.leftKnob.setPosition(newWidth / 4, newCenterY);
          this.rightKnob.setPosition((newWidth * 3) / 4, newCenterY);
          this.leftArea.setPosition(newWidth / 4, newCenterY);
          this.leftArea.width = newWidth / 2;
          this.leftArea.height = newHeight / 3;
          this.rightArea.setPosition((newWidth * 3) / 4, newCenterY);
          this.rightArea.width = newWidth / 2;
          this.rightArea.height = newHeight / 3;
          this.leftGraphics.clear();
          this.leftGraphics.fillStyle(0xffcccc, 1);
          this.leftGraphics.fillRect(
            0,
            newHeight * (2 / 3),
            newWidth / 2,
            newHeight / 3
          );
          this.rightGraphics.clear();
          this.rightGraphics.fillStyle(0xccccff, 1);
          this.rightGraphics.fillRect(
            newWidth / 2,
            newHeight * (2 / 3),
            newWidth / 2,
            newHeight / 3
          );
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

    // Listen for window resize and orientation change.
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
