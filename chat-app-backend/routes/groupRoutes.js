import express from "express";
import Group from "../models/Group.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// create group
router.post("/", protect, async (req, res) => {
  const { name, members } = req.body;

  const group = await Group.create({
    name,
    members: [...members, req.user.userId] // include creator
  });

  res.json(group);
});

// get groups of user
router.get("/", protect, async (req, res) => {
  const groups = await Group.find({
    members: req.user.userId
  });

  res.json(groups);
});

export default router;