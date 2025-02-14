const express = require("express");
const cors = require("cors");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const port = process.env.PORT || 50000;

// Middleware to set HTTP headers to prevent caching
app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, proxy-revalidate"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

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

  // Relay launcherUpdate events with sender's socket id.
  socket.on("launcherUpdate", (data) => {
    console.log("SERVER: Received launcherUpdate from", socket.id, ":", data);
    // Attach sender's id.
    io.emit("launcherUpdate", { id: socket.id, ...data });
  });

  // Relay shoot events with sender's socket id.
  socket.on("shoot", (data) => {
    console.log("SERVER: Received shoot from", socket.id, ":", data);
    io.emit("shoot", { id: socket.id, ...data });
  });

  socket.on("launch", (drag) => {
    console.log("SERVER: Received launch from", socket.id, ":", drag);
    io.emit("launch", drag);
  });

  socket.on("changeColor", (color) => {
    console.log("SERVER: Received changeColor from", socket.id, ":", color);
    io.emit("changeColor", color);
  });

  socket.on("debug", (msg) => {
    console.log(`SERVER DEBUG from ${socket.id}: ${msg}`);
  });

  socket.on("disconnect", () => {
    console.log("SERVER: Client disconnected:", socket.id);
    // Notify all clients that this player disconnected.
    io.emit("playerDisconnected", socket.id);
  });
});

server.listen(port, () => {
  console.log(`SERVER: Listening on port ${port}`);
});
