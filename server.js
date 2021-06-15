var app = require("express")();
var http = require("http").createServer(app);
const PORT = 8080;
var io = require("socket.io")(http, {
  cors: {
    origin: "https://ubhr-api.test",
    methods: ["GET", "POST"],
  },
});
const STATIC_CHANNELS = ["global_notifications", "global_chat"];

let users = [];

const addUser = (userId, socketId) => {
  console.log("userId, socketId", userId, socketId);
  !users.some((user) => user.userId === userId) &&
    users.push({ userId, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

io.on("connection", (socket) => {
  socket.emit("connection", socket.id);

  socket.on("addUser", (userId) => {
    addUser(userId, socket.id);
    io.emit("getUsers", users);
  });

  socket.on("callUser", (data) => {
    io.to(data.userToCall).emit("callUser", {
      signal: data.signalData,
      from: data.from,
      name: data.name,
    });
  });

  socket.on("rejected", (data) => {
    io.to(data.to).emit("rejected");
  });

  socket.on("answerCall", (data) =>
    io.to(data.to).emit("callAccepted", data.signal)
  );

  socket.on("endCall", (data) => {
    io.to(data.to).emit("endCall");
  });

  socket.on("disconnect", () => {
    removeUser(socket.id);
    io.emit("getUsers", users);
    socket.broadcast.emit("callEndedBy", socket.id);
  });
});

http.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
