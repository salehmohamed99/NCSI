const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema({
  survey: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Survey",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  respondedAt: {
    type: Date,
    default: Date.now
  },
  source: {
    type: String,
    enum: ["initial", "firstReminder", "secondReminder"]
  },

  // Link to embedded question by _id and store the response
  answers: [
    {
      questionId: {
        type: mongoose.Schema.Types.ObjectId, // _id of the embedded question in the Survey
        required: true
      },
      answer: mongoose.Schema.Types.Mixed // string, array (for checkbox), number, etc.
    }
  ]
});

// Ensure one response per survey-user
responseSchema.index({ survey: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("SurveyResponse", responseSchema);
