const http = require("http");
const socketIo = require("socket.io");

const server = http.createServer();
const io = socketIo(server);

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.emit("taskAdded", {
    taskId: 1,
    name: "Example Task",
    status: "Pending",
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

server.listen(3000, () => {
  console.log("Socket.IO server running on port 3000");
});
