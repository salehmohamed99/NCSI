const mongoose = require('mongoose');
const TemplateLogSchema = new mongoose.Schema(
  {
    template_name: {
      type: String,
    },
    date:{
      type: Date
    },
    sent: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    failed: {
      type: Number,
      default: 0
    },
    read: {
      type: Number,
      default: 0
    },
    failed_reason:{
      type: String,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('TemplateLog', TemplateLogSchema);
