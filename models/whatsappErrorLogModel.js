const mongoose = require('mongoose');
const WhatsappErrorLogSchema = new mongoose.Schema(
  {
    data: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WhatsappErrorLog', WhatsappErrorLogSchema);
