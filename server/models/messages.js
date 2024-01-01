const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const messageSchema = new Schema(
  {
    conversationId: { type: String },
    senderId: { type: String },
    message: { type: String },
    type: { type: String, enum: ["text", "media", "audio"] },
    status: { type: Boolean, default: false }, //Read for True and Unread For False
  },
  {
    timestamps: { default: Date.now() },
  }
);

const Messages = model("Message", messageSchema);
module.exports = Messages;
