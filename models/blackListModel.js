const mongoose = require('mongoose');
const blackListSchema = new mongoose.Schema(
  {
    phoneNumber: {
      type: String,
    },
    messageType: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('BlackList', blackListSchema);
