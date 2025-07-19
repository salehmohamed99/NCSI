const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ["text", "radio", "checkbox"], required: true },
  answers: [String],
});

const surveySchema = new mongoose.Schema({
  name: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  firstReminder: { type: Date },
  secondReminder: { type: Date },
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  questions: [questionSchema],
  sentLog: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      sentAt: Date,
      type: {
        type: String,
        enum: ["initial", "firstReminder", "secondReminder"],
      },
    },
  ],
  clickCount: { type: Number, default: 0 },
  responseCount: { type: Number, default: 0 },
});

module.exports = mongoose.model("Survey", surveySchema);
