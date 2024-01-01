const mongoose = require("mongoose");
const { Schema, model } = mongoose;

const conversationSchema = new Schema({
  members: { type: Array, required: true },
});

const Conversations = model("Conversation", conversationSchema);
module.exports = Conversations;
