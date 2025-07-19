const agenda = require("./agendaJobs");
const moment = require("moment-timezone");
const Survey = require("../models/surveyModel");
const SurveyResponse = require("../models/surveyResponseModel");

const schedule = {
  sendTemplateMessage: async (data) => {
    console.log({
      agenda,
    });
    await agenda.start();

    const uniqueKey = {
      name: "sendTemplateMessage",
      "data.scheduleAt": data.scheduleAt,
      "data.users": data.users,
      "data.type": data.type,
      "data.client_id": data.client_id,
    };

    const job = await agenda.jobs(uniqueKey);

    if (data.is_scheduled) {
      console.log({
        scheduleAt: moment.utc(data.scheduleAt).toDate(),
      });
      const parsedDate = moment.utc(data.scheduleAt).toDate();
      await agenda.schedule(parsedDate, "sendTemplateMessage", data, {
        unique: uniqueKey,
      });
    } else await agenda.now("sendTemplateMessage", data, { unique: uniqueKey });
  },

  sendMessage: async (data) => {
    // console.log({
    //   agenda,
    //   scheduleAt: moment.utc(data.scheduleAt).toDate()
    // })
    // const parsedDate = moment.utc(data.scheduleAt).toDate();
    // await agenda.start();
    //  const job = await agenda.schedule(parsedDate,"sendMessage", data);
    //  console.log({
    //   status: 'Job scheduled successfully', job
    // });

    try {
      console.log({
        agenda,
        scheduleAt: moment.utc(data.scheduleAt).toDate(),
      });

      const parsedDate = moment.utc(data.scheduleAt).toDate();

      // Start the Agenda instance if it's not started yet
      // if (!agenda._mdb) {
      await agenda.start();
      // }

      // Schedule the job
      const job = await agenda.schedule(parsedDate, "sendMessage", data);

      console.log({
        status: "Job scheduled successfully",
        job: {
          name: job.attrs.name,
          data: job.attrs.data,
          scheduledAt: job.attrs.nextRunAt,
        },
      });
    } catch (error) {
      console.error("Error scheduling job", error);
      throw error; // Propagate the error to handle it in the calling code
    }
  },

  importURL: async (data) => {
    try {
      await agenda.start();
      console.log("test importURL");
      await agenda.now("importURL", data);
    } catch (error) {
      console.error("Error scheduling job", error);
      throw error; // Propagate the error to handle it in the calling code
    }
  },

  campaigns: async (data) => {
    try {
      await agenda.start();
      console.log("test campaigns");
      const uniqueKey = {
        name: "campaigns",
        "data.id": "campaigns",
        "data.data": data.data,
        "data.type": data.campaign,
      };
      await agenda.now("campaigns", data, { unique: uniqueKey });
    } catch (error) {
      console.error("Error scheduling job", error);
      throw error; // Propagate the error to handle it in the calling code
    }
  },

  scheduleSurvey: async (survey) => {
    await agenda.cancel({ "data.surveyId": survey._id });

    if (survey.startDate)
      await agenda.schedule(survey.startDate, "send survey", {
        surveyId: survey._id,
        type: "initial",
      });
    if (survey.firstReminder)
      await agenda.schedule(survey.firstReminder, "send survey", {
        surveyId: survey._id,
        type: "firstReminder",
      });
    if (survey.secondReminder)
      await agenda.schedule(survey.secondReminder, "send survey", {
        surveyId: survey._id,
        type: "secondReminder",
      });
  },
};

module.exports = schedule;
