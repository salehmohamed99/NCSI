const mongoose = require("mongoose");
const MessageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
    },
    caption: {
      type: String,
    },
    seen: {
      type: Boolean,
    },
    type: {
      type: String,
    },
    status: {
      type: String,
    },
    wa_msg_id: {
      type: String,
    },
    client_id: {
      type: String,
    },
    is_scheduled:{
      type: Boolean,
      default: false,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", MessageSchema);
