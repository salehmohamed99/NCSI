const Survey = require("../models/surveyModel");
const scheduleService = require("../services/scheduler");
const { parseUsersFromFile, chunkArray } = require("../utils/userUtils");
const Agenda = require("agenda");

// GET /api/surveys
exports.index = async (req, res) => {
  try {
    const surveys = await Survey.find().sort({ createdAt: -1 });
    res.json({ success: true, data: surveys });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// GET /api/surveys/:id
exports.show = async (req, res) => {
  try {
    const survey = await Survey.findById(req.params.id);
    if (!survey)
      return res
        .status(404)
        .json({ success: false, error: "Survey not found" });
    res.json({ success: true, data: survey });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// POST /api/surveys
exports.store = async (req, res) => {
  try {
    const {
      name,
      startDate,
      endDate,
      firstReminder,
      secondReminder,
      users,
      questions,
    } = req.body;

    console.log({
      body: req.body,
      users: req.files ? req.files.files : "",
    });
    console.log({
      "typeof questions": typeof questions,
    });

    let parsedQuestions = questions;
    if (typeof questions === "string") {
      try {
        parsedQuestions = JSON.parse(questions);
      } catch (err) {
        console.error("Failed to parse questions:", err);
        return res
          .status(400)
          .json({ success: false, error: "Invalid questions format" });
      }
    }
    const survey = new Survey({
      name,
      startDate,
      endDate,
      firstReminder,
      secondReminder,
      users,
      questions: parsedQuestions,
    });

    await survey.save();

    // Schedule user assignment jobs if file uploaded
    if (req.files && req.files.files) {
      const file = req.files.files;
      const parsedUsers = await parseUsersFromFile(file);
      const chunks = chunkArray(parsedUsers, 5);
      console.log({
        chunks,
      });
      await scheduleService.scheduleInsertSurveyUsersJobs(chunks, survey);
    }
    // Schedule reminder jobs
    await scheduleService.scheduleSurveyJobs(survey);

    res.status(201).json({ success: true, data: req.body });
  } catch (err) {
    console.log({ err });
    res.status(400).json({ success: false, error: err.message });
  }
};

// PUT /api/surveys/:id
exports.update = async (req, res) => {
  try {
    let parsedQuestions = req.body.questions;
    if (typeof parsedQuestions === "string") {
      try {
        parsedQuestions = JSON.parse(parsedQuestions);
      } catch (err) {
        console.error("Failed to parse questions:", err);
        return res
          .status(400)
          .json({ success: false, error: "Invalid questions format" });
      }
    }

    req.body.questions = parsedQuestions;

    // Update survey
    const survey = await Survey.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!survey) {
      return res
        .status(404)
        .json({ success: false, error: "Survey not found" });
    }

    // Handle uploaded users from file
    if (req.files && req.files.files) {
      const file = req.files.files;
      const parsedUsers = await parseUsersFromFile(file);

      // Clear old users from the survey
      survey.users = [];
      await survey.save();

      const chunks = chunkArray(parsedUsers, 5);

      // Schedule new jobs to assign the new users
      await scheduleService.scheduleInsertSurveyUsersJobs(chunks, survey);
    }

    // Reschedule survey jobs (e.g., start/end notifications)
    await scheduleService.scheduleSurveyJobs(survey);

    res.json({ success: true, data: survey });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// DELETE /api/surveys/:id
exports.delete = async (req, res) => {
  try {
    const survey = await Survey.findByIdAndDelete(req.params.id);

    if (!survey) {
      return res
        .status(404)
        .json({ success: false, error: "Survey not found" });
    }

    // Cancel related jobs
    // const agenda = require("../services/agendaInstance");
    // await agenda.cancel({ "data.surveyId": survey._id });

    await scheduleService.cancleSurveyJobs(survey);

    res.json({ success: true, message: "Survey deleted" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
