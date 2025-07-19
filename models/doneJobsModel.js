const mongoose = require('mongoose');
const doneJobsSchema = new mongoose.Schema(
  {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    users: {
      type: Array,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('DoneJobs', doneJobsSchema);