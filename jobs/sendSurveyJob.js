const Survey = require("../models/surveyModel");
const DoneJobs = require("../models/doneJobsModel");
const OrderID = require("../models/OrderIDModel");
const sendToWhatsapp = require("../controllers/sendToWhatsapp");

module.exports = async function (job) {
  const { surveyId, type } = job.attrs.data;
  const jobId = job.attrs._id;
  const survey = await Survey.findById(surveyId).populate("users");
  if (!survey) return;

  const isJobExist = await DoneJobs.findOne({ job_id: jobId });
  if (isJobExist) {
    console.log("#########################################################");
    console.log(
      "--------------------------[job Exists ]-----------------------"
    );
    console.log("#########################################################");
  } else {
    await DoneJobs.create({ job_id: jobId });
    console.log("#########################################################");
    console.log(
      "--------------------------[job Not Exists ]-----------------------"
    );
    console.log("#########################################################");
  }

  if (!isJobExist) {
    for (const user of survey.users) {
      const alreadySent = survey.sentLog.some(
        (log) =>
          log.user.toString() === user._id.toString() && log.type === type
      );
      if (!alreadySent) {
        survey.sentLog.push({ user: user._id, sentAt: new Date(), type });
        // TODO: Add email or notification logic here
        console.log(`Survey sent to ${user._id} [${type}]`);

        const wellcomeData = {
          from: "00",
          to: user.phone_number,
          phone_number: user.phone_number,
          type: "dynamic_test",
          questions: survey.questions,
          survey_id: survey._id,
          userId: user._id,
          source: "initial"
        };
        await sendToWhatsapp.sendToWhatsapp(wellcomeData);

      }
    }
    await survey.save();
  }
};
