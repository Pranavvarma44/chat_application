import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  room: String,

  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  text: String,

  // ✅ NEW: message status
  status: {
    type: String,
    enum: ["sent", "delivered", "seen"],
    default: "sent"
  },
  seenBy: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  ],

  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("Message", MessageSchema);