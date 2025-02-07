// client/src/LauncherController.js
import React, { useState } from "react";
import { Stage, Layer, Circle, Line, Rect, Text } from "react-konva";

const LauncherController = ({ socket }) => {
  const stageWidth = window.innerWidth;
  const stageHeight = window.innerHeight;
  const initialPos = { x: stageWidth / 2, y: stageHeight / 2 };
  // Position the "Change Color" button in the top half.
  const buttonPos = { x: stageWidth / 2 - 75, y: stageHeight / 4 - 37.5 };

  // Use a state variable for the launcher circle's position.
  const [launcherPos, setLauncherPos] = useState(initialPos);
  const [dragLine, setDragLine] = useState(null);
  const [buttonFill, setButtonFill] = useState("blue");

  // Helper: generate a bright random color (avoid white).
  const getRandomBrightColor = () => {
    const r = Math.floor(Math.random() * 128) + 128; // 128-255
    const g = Math.floor(Math.random() * 128) + 128;
    const b = Math.floor(Math.random() * 128) + 128;
    const toHex = (num) => {
      const hex = num.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return "#" + toHex(r) + toHex(g) + toHex(b);
  };

  // Called during dragging: update launcherPos and draw dragLine.
  const handleDragMove = (e) => {
    const newPos = e.target.position();
    setLauncherPos(newPos);
    const dx = newPos.x - initialPos.x;
    const dy = newPos.y - initialPos.y;
    setDragLine([initialPos.x, initialPos.y, newPos.x, newPos.y]);
    console.log(`LauncherController: Dragging. dx: ${dx}, dy: ${dy}`);
    if (socket) {
      socket.emit("launcherUpdate", { dx, dy });
      socket.emit("debug", `Launcher dragging: dx=${dx}, dy=${dy}`);
    }
  };

  // Called when dragging ends: send launch event and snap back.
  const handleDragEnd = (e) => {
    const finalPos = e.target.position();
    const dx = finalPos.x - initialPos.x;
    const dy = finalPos.y - initialPos.y;
    console.log("LauncherController: Drag ended. Final drag vector:", {
      dx,
      dy,
    });
    if (socket) {
      socket.emit("launch", { dx, dy });
      socket.emit(
        "debug",
        `Launcher released: launch event with dx=${dx}, dy=${dy}`
      );
    }
    // Snap back to initial position.
    setLauncherPos(initialPos);
    setDragLine(null);
  };

  // Called when the "Change Color" button is pressed.
  const handleChangeColor = () => {
    const color = getRandomBrightColor();
    console.log(
      "LauncherController: Change Color button pressed. Generated color:",
      color
    );
    if (socket) {
      socket.emit("changeColor", color);
      socket.emit("debug", `Change Color event: color ${color}`);
    }
  };

  // Change button color on pointer events.
  const handleButtonPointerDown = () => {
    setButtonFill("green");
    console.log("LauncherController: Change Color button pointer down.");
  };

  const handleButtonPointerUp = () => {
    setButtonFill("blue");
    console.log("LauncherController: Change Color button pointer up.");
  };

  return (
    <Stage width={stageWidth} height={stageHeight}>
      <Layer>
        {/* Draw the drag line if present */}
        {dragLine && <Line points={dragLine} stroke="black" strokeWidth={2} />}
        {/* Draggable launcher circle that snaps back */}
        <Circle
          x={launcherPos.x}
          y={launcherPos.y}
          radius={40}
          fill="orange"
          draggable
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        />
        <Text
          text="Drag launcher & release to launch ball"
          fontSize={20}
          fill="black"
          x={initialPos.x - 150}
          y={initialPos.y - 80}
        />
        {/* "Change Color" button */}
        <Rect
          x={buttonPos.x}
          y={buttonPos.y}
          width={150}
          height={75}
          fill={buttonFill}
          onPointerDown={handleButtonPointerDown}
          onPointerUp={handleButtonPointerUp}
          onClick={handleChangeColor}
          onTap={handleChangeColor} // For mobile tap events.
        />
        <Text
          text="Change Color"
          fontSize={20}
          fill="white"
          x={buttonPos.x + 20}
          y={buttonPos.y + 25}
        />
      </Layer>
    </Stage>
  );
};

export default LauncherController;
