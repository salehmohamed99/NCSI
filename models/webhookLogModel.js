const mongoose = require('mongoose');
const WebhookLogSchema = new mongoose.Schema(
  {
    data: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WebhookLog', WebhookLogSchema);
