// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({ origin: true, credentials: true }));

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "client", "build")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "client", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running");
  });
}

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("SERVER: New client connected:", socket.id);

  socket.on("launch", (drag) => {
    console.log("SERVER: Received launch from", socket.id, ":", drag);
    io.emit("launch", drag);
  });

  socket.on("changeColor", (color) => {
    console.log("SERVER: Received changeColor from", socket.id, ":", color);
    io.emit("changeColor", color);
  });

  socket.on("launcherUpdate", (data) => {
    console.log("SERVER: Received launcherUpdate from", socket.id, ":", data);
  });

  socket.on("debug", (msg) => {
    console.log(`SERVER DEBUG from ${socket.id}: ${msg}`);
  });

  socket.on("disconnect", () => {
    console.log("SERVER: Client disconnected:", socket.id);
  });
});

server.listen(port, () => {
  console.log(`SERVER: Listening on port ${port}`);
});
