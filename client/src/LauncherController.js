// client/src/LauncherController.js
import React, { useState } from "react";
import { Stage, Layer, Circle, Rect, Text } from "react-konva";

const LauncherController = ({ socket }) => {
  const stageWidth = window.innerWidth;
  const stageHeight = window.innerHeight;

  // Define centers for the two analog sticks:
  const leftCenter = { x: stageWidth / 4, y: stageHeight / 2 };
  const rightCenter = { x: (3 * stageWidth) / 4, y: stageHeight / 2 };

  // Define the allowed drag radius and the sizes for the analog stick elements.
  const allowedRadius = 50; // Maximum distance the inner circle can be dragged
  const outerRadius = allowedRadius; // Visual boundary (deadzone)
  const innerRadius = 20; // Draggable circle size

  // State to track the inner circles’ positions.
  const [leftStickPos, setLeftStickPos] = useState(leftCenter);
  const [rightStickPos, setRightStickPos] = useState(rightCenter);

  // Helper: generate a bright random color (avoid colors too light).
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

  // Limit the left analog stick’s movement to within the allowed radius.
  const leftDragBound = (pos) => {
    const dx = pos.x - leftCenter.x;
    const dy = pos.y - leftCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > allowedRadius) {
      const angle = Math.atan2(dy, dx);
      return {
        x: leftCenter.x + allowedRadius * Math.cos(angle),
        y: leftCenter.y + allowedRadius * Math.sin(angle),
      };
    }
    return pos;
  };

  // Limit the right analog stick’s movement to within the allowed radius.
  const rightDragBound = (pos) => {
    const dx = pos.x - rightCenter.x;
    const dy = pos.y - rightCenter.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > allowedRadius) {
      const angle = Math.atan2(dy, dx);
      return {
        x: rightCenter.x + allowedRadius * Math.cos(angle),
        y: rightCenter.y + allowedRadius * Math.sin(angle),
      };
    }
    return pos;
  };

  // LEFT ANALOG STICK (Movement)
  // As the left stick is dragged, compute its displacement from the deadzone center
  // and send that information to the game (e.g. to move a circle).
  const handleLeftDragMove = (e) => {
    const newPos = e.target.position();
    setLeftStickPos(newPos);
    const dx = newPos.x - leftCenter.x;
    const dy = newPos.y - leftCenter.y;
    console.log(`Left Stick: dx: ${dx}, dy: ${dy}`);
    if (socket) {
      // A scaling factor can be adjusted if needed.
      const factor = 1;
      socket.emit("launcherUpdate", { dx: dx * factor, dy: dy * factor });
      socket.emit("debug", `Left Stick dragging: dx=${dx}, dy=${dy}`);
    }
  };

  // When the left stick is released, reset its position and signal that movement stops.
  const handleLeftDragEnd = () => {
    setLeftStickPos(leftCenter);
    if (socket) {
      socket.emit("launcherUpdate", { dx: 0, dy: 0 });
      socket.emit("debug", "Left Stick released: movement stopped");
    }
  };

  // RIGHT ANALOG STICK (Shoot/Action)
  // For now, when the right stick is released, simply change the ball’s color.
  const handleRightDragMove = (e) => {
    const newPos = e.target.position();
    setRightStickPos(newPos);
    // Optionally, you can add visual feedback here.
  };

  const handleRightDragEnd = () => {
    setRightStickPos(rightCenter);
    const color = getRandomBrightColor();
    console.log("Right Stick released: changeColor event with color:", color);
    if (socket) {
      socket.emit("changeColor", color);
      socket.emit(
        "debug",
        `Right Stick released: changeColor event with color ${color}`
      );
    }
  };

  return (
    <Stage width={stageWidth} height={stageHeight}>
      <Layer>
        {/* Background halves */}
        <Rect
          x={0}
          y={0}
          width={stageWidth / 2}
          height={stageHeight}
          fill="#ffcccc" // light red for the left half
        />
        <Rect
          x={stageWidth / 2}
          y={0}
          width={stageWidth / 2}
          height={stageHeight}
          fill="#ccccff" // light blue for the right half
        />

        {/* LEFT ANALOG STICK */}
        {/* Outer circle indicating the deadzone boundary */}
        <Circle
          x={leftCenter.x}
          y={leftCenter.y}
          radius={outerRadius}
          stroke="black"
          strokeWidth={2}
          dash={[4, 4]}
        />
        {/* Draggable inner circle */}
        <Circle
          x={leftStickPos.x}
          y={leftStickPos.y}
          radius={innerRadius}
          fill="gray"
          draggable
          dragBoundFunc={leftDragBound}
          onDragMove={handleLeftDragMove}
          onDragEnd={handleLeftDragEnd}
        />
        <Text
          text="Move"
          fontSize={18}
          fill="black"
          x={leftCenter.x - 20}
          y={leftCenter.y - outerRadius - 30}
        />

        {/* RIGHT ANALOG STICK */}
        {/* Outer circle indicating the deadzone boundary */}
        <Circle
          x={rightCenter.x}
          y={rightCenter.y}
          radius={outerRadius}
          stroke="black"
          strokeWidth={2}
          dash={[4, 4]}
        />
        {/* Draggable inner circle */}
        <Circle
          x={rightStickPos.x}
          y={rightStickPos.y}
          radius={innerRadius}
          fill="gray"
          draggable
          dragBoundFunc={rightDragBound}
          onDragMove={handleRightDragMove}
          onDragEnd={handleRightDragEnd}
        />
        <Text
          text="Shoot"
          fontSize={18}
          fill="black"
          x={rightCenter.x - 25}
          y={rightCenter.y - outerRadius - 30}
        />
      </Layer>
    </Stage>
  );
};

export default LauncherController;
