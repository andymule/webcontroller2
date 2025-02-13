import React from "react";

const LauncherController = ({ socket }) => {
  // Helper: generate a bright random color as a hex string.
  const getRandomBrightColor = () => {
    const r = Math.floor(Math.random() * 128) + 128; // 128-255
    const g = Math.floor(Math.random() * 128) + 128;
    const b = Math.floor(Math.random() * 128) + 128;
    // Convert each component to a 2-digit hex value and combine.
    const toHex = (num) => {
      const hex = num.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  };

  // Handler for moving the ship up.
  const handleMoveUp = () => {
    if (socket) {
      socket.emit("moveUp");
      socket.emit("debug", "Move Up button pressed");
    }
  };

  // Handler for changing the ship's color.
  const handleChangeColor = () => {
    if (socket) {
      const color = getRandomBrightColor();
      socket.emit("changeColor", color);
      socket.emit("debug", `Change Color button pressed: ${color}`);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
        alignItems: "center",
        padding: "1rem",
      }}
    >
      <button
        onClick={handleMoveUp}
        style={{ padding: "1rem 2rem", fontSize: "1.25rem" }}
      >
        Move Up
      </button>
      <button
        onClick={handleChangeColor}
        style={{ padding: "1rem 2rem", fontSize: "1.25rem" }}
      >
        Change Color
      </button>
    </div>
  );
};

export default LauncherController;
