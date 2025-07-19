const mongoose = require('mongoose');
const WebhookFailedLogSchema = new mongoose.Schema(
  {
    data: {
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('WebhookFailedLog', WebhookFailedLogSchema);
