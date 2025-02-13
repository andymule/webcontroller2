import React, { useEffect, useRef } from "react";
import * as PIXI from "pixi.js";

const PixiHelloWorld = () => {
  const containerRef = useRef(null);
  const appRef = useRef(null);

  useEffect(() => {
    // Create a PIXI Application with a background color.
    const app = new PIXI.Application({
      width: window.innerWidth,
      height: window.innerHeight,
      backgroundColor: 0x1099bb, // a blue-ish background
    });
    appRef.current = app;

    // Append the PIXI canvas to the container div.
    if (containerRef.current) {
      containerRef.current.appendChild(app.view);
    }

    // Create a simple "Hello World" text.
    const helloText = new PIXI.Text("Hello World", {
      fontFamily: "Arial",
      fontSize: 36,
      fill: 0xffffff,
      align: "center",
    });
    helloText.anchor.set(0.5);
    helloText.x = app.screen.width / 2;
    helloText.y = app.screen.height / 2;
    app.stage.addChild(helloText);

    // Resize handler: update renderer and reposition the text.
    const resize = () => {
      if (!app.renderer) return; // Guard if renderer is gone.
      app.renderer.resize(window.innerWidth, window.innerHeight);
      helloText.x = app.screen.width / 2;
      helloText.y = app.screen.height / 2;
    };

    window.addEventListener("resize", resize);

    // Cleanup on unmount.
    return () => {
      window.removeEventListener("resize", resize);
      app.destroy(true, { children: true });
    };
  }, []);

  return <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />;
};

export default PixiHelloWorld;
