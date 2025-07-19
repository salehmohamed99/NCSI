const mongoose = require("mongoose");
const TokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
    },
   
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Token", TokenSchema);
