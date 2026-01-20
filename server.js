const express = require("express");
const http = require("http");
const path = require("path");
const {Server} = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, "public")));

const usersBySocket = new Map();
const socketsByUser = new Map();
const messages = [];
const MAX_MESSAGES = 1000;

const broadcastUsers = () => {
  io.emit("users", {users: [...socketsByUser.keys()]});
}

io.on("connection", socket => {
  socket.on("set username", (username, ack) => {
    if (!username) {
      return;
    }

    const existing = socketsByUser.get(username);

    if (existing && existing !== socket.id) {
      io.sockets.sockets.get(existing)?.disconnect(true);
    }

    usersBySocket.set(socket.id, username);
    socketsByUser.set(username, socket.id);
    broadcastUsers();
    ack?.({ messages });
  });

  socket.on("chat message", text => {
    const username = usersBySocket.get(socket.id);
    if (!username || !text) {
      return;
    }

    const message = {
      username,
      text,
      time: new Date().toLocaleTimeString(),
    };
    io.emit("chat message", message);
    messages.push(message);

    if (messages.length > MAX_MESSAGES) {
      messages.shift();
    }
  });

  socket.on("disconnect", () => {
    const username = usersBySocket.get(socket.id);

    if (username) {
      usersBySocket.delete(socket.id);
      socketsByUser.delete(username);
      broadcastUsers();
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});

