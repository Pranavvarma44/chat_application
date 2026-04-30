import { io } from "socket.io-client";

const socket = io("https://chat-application-u78g.onrender.com", {
  auth: {
    token: ""
  }
});

socket.on("connect", () => {
  console.log("Connected:", socket.id);

  socket.emit("join_room", "general");

  socket.emit("send_message", {
    room: "general",
    text: "hello from socket"
  });
});

socket.on("receive_message", (msg) => {
  console.log("Received:", msg);
});