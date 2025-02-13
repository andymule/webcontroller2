import React, { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

const PixiLauncherController = ({ socket }) => {
  const pixiContainerRef = useRef(null);

  useEffect(() => {
    // Create a full-screen PIXI Application.
    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundAlpha: 0, // We'll draw our own backgrounds.
    });

    // Ensure the container exists before appending.
    if (pixiContainerRef.current) {
      pixiContainerRef.current.appendChild(app.view);
    }

    // Draw left (light red) and right (light blue) background halves.
    const leftBG = new PIXI.Graphics();
    leftBG.beginFill(0xffcccc); // light red
    leftBG.drawRect(0, 0, app.screen.width / 2, app.screen.height);
    leftBG.endFill();
    app.stage.addChild(leftBG);

    const rightBG = new PIXI.Graphics();
    rightBG.beginFill(0xccccff); // light blue
    rightBG.drawRect(app.screen.width / 2, 0, app.screen.width / 2, app.screen.height);
    rightBG.endFill();
    app.stage.addChild(rightBG);

    // ----- Analog Stick Settings -----
    const stickRadius = 50;
    const knobRadius = 20;
    const maxDistance = stickRadius;

    // ---------- LEFT ANALOG STICK ----------
    const leftStickContainer = new PIXI.Container();
    leftStickContainer.x = app.screen.width / 4;
    leftStickContainer.y = app.screen.height * 0.75;
    app.stage.addChild(leftStickContainer);

    const leftBase = new PIXI.Graphics();
    leftBase.beginFill(0x888888, 0.5);
    leftBase.drawCircle(0, 0, stickRadius);
    leftBase.endFill();
    leftStickContainer.addChild(leftBase);

    const leftKnob = new PIXI.Graphics();
    leftKnob.beginFill(0xffffff);
    leftKnob.drawCircle(0, 0, knobRadius);
    leftKnob.endFill();
    leftKnob.interactive = true;
    leftKnob.buttonMode = true;
    leftStickContainer.addChild(leftKnob);

    let leftDragging = false;

    leftKnob.on("pointerdown", () => {
      leftDragging = true;
    });

    app.stage.interactive = true;
    app.stage.on("pointermove", (event) => {
      if (leftDragging) {
        const pos = event.data.getLocalPosition(leftStickContainer);
        const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
        let clampedX = pos.x;
        let clampedY = pos.y;
        if (distance > maxDistance) {
          const angle = Math.atan2(pos.y, pos.x);
          clampedX = Math.cos(angle) * maxDistance;
          clampedY = Math.sin(angle) * maxDistance;
        }
        leftKnob.x = clampedX;
        leftKnob.y = clampedY;
        const normX = clampedX / maxDistance;
        const normY = clampedY / maxDistance;
        if (socket) {
          socket.emit("launcherUpdate", { dx: normX, dy: normY });
        }
      }
    });

    leftKnob.on("pointerup", () => {
      leftDragging = false;
      leftKnob.x = 0;
      leftKnob.y = 0;
      if (socket) {
        socket.emit("launcherUpdate", { dx: 0, dy: 0 });
      }
    });
    leftKnob.on("pointerupoutside", () => {
      leftDragging = false;
      leftKnob.x = 0;
      leftKnob.y = 0;
      if (socket) {
        socket.emit("launcherUpdate", { dx: 0, dy: 0 });
      }
    });

    // ---------- RIGHT ANALOG STICK ----------
    const rightStickContainer = new PIXI.Container();
    rightStickContainer.x = app.screen.width * 0.75;
    rightStickContainer.y = app.screen.height * 0.75;
    app.stage.addChild(rightStickContainer);

    const rightBase = new PIXI.Graphics();
    rightBase.beginFill(0x888888, 0.5);
    rightBase.drawCircle(0, 0, stickRadius);
    rightBase.endFill();
    rightStickContainer.addChild(rightBase);

    const rightKnob = new PIXI.Graphics();
    rightKnob.beginFill(0xffffff);
    rightKnob.drawCircle(0, 0, knobRadius);
    rightKnob.endFill();
    rightKnob.interactive = true;
    rightKnob.buttonMode = true;
    rightStickContainer.addChild(rightKnob);

    let rightDragging = false;
    let rightMoved = false;

    rightKnob.on("pointerdown", () => {
      rightDragging = true;
      rightMoved = false;
    });

    app.stage.on("pointermove", (event) => {
      if (rightDragging) {
        const pos = event.data.getLocalPosition(rightStickContainer);
        const distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
        let clampedX = pos.x;
        let clampedY = pos.y;
        if (distance > maxDistance) {
          const angle = Math.atan2(pos.y, pos.x);
          clampedX = Math.cos(angle) * maxDistance;
          clampedY = Math.sin(angle) * maxDistance;
        }
        rightKnob.x = clampedX;
        rightKnob.y = clampedY;
        if (Math.abs(clampedX) > 5 || Math.abs(clampedY) > 5) {
          rightMoved = true;
        }
      }
    });

    const emitRightAction = () => {
      if (rightMoved && socket) {
        const r = Math.floor(Math.random() * 128) + 128;
        const g = Math.floor(Math.random() * 128) + 128;
        const b = Math.floor(Math.random() * 128) + 128;
        const toHex = (num) => num.toString(16).padStart(2, "0");
        const color = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        socket.emit("changeColor", color);
      }
      rightKnob.x = 0;
      rightKnob.y = 0;
    };

    rightKnob.on("pointerup", () => {
      rightDragging = false;
      emitRightAction();
    });
    rightKnob.on("pointerupoutside", () => {
      rightDragging = false;
      emitRightAction();
    });

    // ----- Handle resizing -----
    const resize = () => {
      if (!app.renderer) return; // Guard: skip if renderer is gone.
      app.renderer.resize(window.innerWidth, window.innerHeight);

      leftBG.clear();
      leftBG.beginFill(0xffcccc);
      leftBG.drawRect(0, 0, app.screen.width / 2, app.screen.height);
      leftBG.endFill();

      rightBG.clear();
      rightBG.beginFill(0xccccff);
      rightBG.drawRect(app.screen.width / 2, 0, app.screen.width / 2, app.screen.height);
      rightBG.endFill();

      leftStickContainer.x = app.screen.width / 4;
      leftStickContainer.y = app.screen.height * 0.75;
      rightStickContainer.x = app.screen.width * 0.75;
      rightStickContainer.y = app.screen.height * 0.75;
    };
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      app.destroy(true, { children: true });
    };
  }, [socket]);

  return <div ref={pixiContainerRef} style={{ width: "100%", height: "100vh" }} />;
};

export default PixiLauncherController;
