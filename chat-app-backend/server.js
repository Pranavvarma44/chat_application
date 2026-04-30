import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

import { connectDB } from "./config/db.js";
import messageRoutes from "./routes/messageRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import Message from "./models/Message.js";
import userRoutes from "./routes/userRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";

dotenv.config();

const app = express();

// 🔐 Middleware
app.use(cors({
  origin: "*",
  credentials: true
}));

app.use(express.json());

// 🌐 Routes
app.use("/api/messages", messageRoutes);
app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);

// 🧪 Test route (useful for debugging)
app.get("/", (req, res) => {
  res.send("Backend is running 🚀");
});

// 🗄️ Connect DB
connectDB();

// ⚡ Create server
const server = http.createServer(app);

// 🔌 Socket setup
const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"]
  }
});

// 🔐 Socket authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;

    if (!token) return next(new Error("No token"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;

    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
});

// 🔁 Socket connection
// 🔁 Socket connection
const onlineUsers = new Map();

io.on("connection", (socket) => {
  const userId = socket.user?.userId;

  socket.currentRoom = null;

  if (userId) {
    onlineUsers.set(userId.toString(), socket.id);
  }

  console.log("ONLINE USERS:", [...onlineUsers.entries()]);

  io.emit("online_users", Array.from(onlineUsers.keys()));

  // =========================
  // JOIN ROOM
  // =========================
  socket.on("join_room", (room) => {
    socket.join(room);
    socket.currentRoom = room;

    console.log("JOIN ROOM:", room);
  });

  // =========================
  // SEND MESSAGE (FIXED)
  // =========================
  socket.on("send_message", async ({ room, text }) => {
    try {
      const sender = socket.user.userId;

      console.log("📤 SEND MESSAGE:", { room, text, sender });

      const message = await Message.create({
        room,
        text,
        sender, // ✅ FIXED
        status: "sent",
        seenBy: [sender],
      });

      const populated = await message.populate("sender", "name"); // ✅ FIXED

      io.to(room).emit("receive_message", populated);
    } catch (err) {
      console.error("❌ SEND ERROR:", err);
    }
  });

  // =========================
  // ✔✔ DELIVERED
  // =========================
  socket.on("message_delivered", async ({ messageId, room }) => {
    await Message.findByIdAndUpdate(messageId, {
      status: "delivered",
    });

    io.to(room).emit("message_status", {
      messageId,
      status: "delivered",
    });
  });

  // =========================
  // 👁️ SEEN
  // =========================
  socket.on("message_seen", async ({ messageId }) => {
    const msg = await Message.findById(messageId);
    if (!msg) return;

    const userId = socket.user.userId;

    if (socket.currentRoom !== msg.room) return;
    if (!onlineUsers.has(userId.toString())) return;
    if (msg.sender?.toString() === userId) return;

    if (!msg.seenBy.includes(userId)) {
      msg.seenBy.push(userId);
    }

    msg.status = "seen";
    await msg.save();

    io.to(msg.room).emit("message_status", {
      messageId,
      status: "seen",
    });
  });

  // =========================
  // TYPING
  // =========================
  socket.on("typing", (room) => {
    socket.to(room).emit("typing", { userId });
  });

  socket.on("stop_typing", (room) => {
    socket.to(room).emit("stop_typing", { userId });
  });

  // =========================
  // DISCONNECT
  // =========================
  socket.on("disconnect", () => {
    if (userId) {
      onlineUsers.delete(userId.toString());
    }

    io.emit("online_users", Array.from(onlineUsers.keys()));
  });
});
// 🚀 Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});

// 🔍 Debug (optional)
console.log("MONGO_URI:", process.env.MONGO_URI ? "Loaded ✅" : "Missing ❌");