// App.js
import React, { useEffect, useState } from "react";
import { io } from "socket.io-client";
import GameCanvas from "./GameCanvas"; // Desktop game
import PhaserMobileController from "./PhaserMobileController"; // Mobile controller

const App = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const mobileCheck = /Mobi|Android/i.test(navigator.userAgent);
    setIsMobile(mobileCheck);
    console.log("Detected device type:", mobileCheck ? "Mobile" : "Desktop");

    const newSocket = io({
      transports: ["websocket", "polling"],
    });
    setSocket(newSocket);
    newSocket.on("connect", () => {
      console.log("Socket connected:", newSocket.id);
    });

    return () => newSocket.disconnect();
  }, []);

  return (
    <div style={{ textAlign: "center"}}>
      <h1>{isMobile ? "Mobile Controller" : "Desktop Display"}</h1>
      {isMobile ? (
        <PhaserMobileController socket={socket} />
      ) : (
        <GameCanvas socket={socket} />
      )}
    </div>
  );
};

export default App;
