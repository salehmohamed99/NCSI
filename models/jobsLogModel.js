const mongoose = require('mongoose');
const jobsLogSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    phone_number: {
       type: Number,
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('JobsLog', jobsLogSchema);
