import express from "express";
import Message from "../models/Message.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();


router.get("/:room", protect, async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .populate("sender", "username email") 
      .sort({ timestamp: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post("/", protect, async (req, res) => {
  try {
    const { room, text } = req.body;

    if (!room || !text) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const sender = req.user.userId; 

    const message = await Message.create({
      room,
      sender,
      text
    });

    const populatedMessage = await message.populate("sender", "username email");

    res.status(201).json(populatedMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;