const mongoose = require('mongoose');
const WhatsappLogSchema = new mongoose.Schema(
  {
    data: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WhatsappLog', WhatsappLogSchema);
