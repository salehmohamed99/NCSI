const Agenda = require("agenda");
const Survey = require("../models/surveyModel");
const SurveyResponse = require("../models/surveyResponseModel");
const mongoose = require("mongoose");
const User = require("../models/userModel");
const moment = require("moment-timezone");

const DoneJobs = require("../models/doneJobsModel");
const OrderID = require("../models/OrderIDModel");
const sendToWhatsapp = require("../controllers/sendToWhatsapp");

const DATABASE = process.env.DB_URI;
console.log({ DATABASE });
const DB = DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
// const DB = DATABASE;

const agenda = new Agenda({
  db: { address: DB, collection: "agendaJobs" },
  timezone: "UTC",
});

// Define your send survey job here (make sure to define job processor elsewhere)
agenda.define("send survey", async (job) => {
  const { surveyId, type } = job.attrs.data;
  const jobId = job.attrs._id;
  const survey = await Survey.findById(surveyId).populate("users");
  const surveyResponseRes = await SurveyResponse.findById(surveyId).populate(
    "users"
  );
  if (!survey) return;

  console.log({ jobId });

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
      const existingResponse = await SurveyResponse.findOne({
        survey: new mongoose.Types.ObjectId(surveyId),
        user: new mongoose.Types.ObjectId(user._id),
      });

      if (!existingResponse) {
        const alreadySent = survey.sentLog.some(
          (log) =>
            log.user.toString() === user._id.toString() && log.type === type
        );
        if (!alreadySent) {
          survey.sentLog.push({ user: user._id, sentAt: new Date(), type });
          // TODO: Add email or notification logic here
          console.log(`@ Survey sent to #${user._id} [${type}]`);

          const wellcomeData = {
            from: "00",
            to: user.phone_number,
            phone_number: user.phone_number,
            type: "dynamic_test",
            questions: survey.questions,
            survey_id: survey._id,
            name: survey.name,
            source: type,
          };
          console.log({ wellcomeData });
          await sendToWhatsapp.sendToWhatsapp(wellcomeData);
        }
      }
    }
    await survey.save();
  }
});

// agenda.define("assign users to survey", async (job) => {
//   const { surveyId, users } = job.attrs.data;
//   const survey = await Survey.findById(surveyId);
//   if (!survey) return;

//   const insertedUsers = await User.insertMany(users);

//   await Survey.findByIdAndUpdate(surveyId, {
//     $addToSet: { users: { $each: insertedUsers.map((u) => u._id) } },
//   });

//   console.log(`Assigned ${insertedUsers.length} users to survey ${surveyId}`);
// });

agenda.define("assign users to survey", async (job) => {
  const { surveyId, users } = job.attrs.data;

  const survey = await Survey.findById(surveyId);
  if (!survey) return;

  // Extract unique identifiers
  const phones = users.map((u) => u.phone_number);
  console.log({
    phones,
  });

  //   // Find existing users by email
  //   const existingUsers = await User.find({ phone_number: { $in: phones } });

  //   const uniqueUsers = Object.values(
  //   existingUsers.reduce((acc, user) => {
  //     const phone = user.phone_number;
  //     if (!acc[phone]) {
  //       acc[phone] = user; // Keep the first one found
  //     }
  //     return acc;
  //   }, {})
  // );

  //   const existingEmails = uniqueUsers.map((u) => u.phone_number);

  //   // Filter out users that already exist
  //   const newUsers = users.filter(
  //     (u) => !existingEmails.includes(u.phone_number)
  //   );

  const existingUsers = await User.find({ phone_number: { $in: phones } });

  const uniqueUsers = Object.values(
    existingUsers.reduce((acc, user) => {
      const phone = String(user.phone_number).replace(/\D/g, "");
      if (!acc[phone]) {
        acc[phone] = user;
      }
      return acc;
    }, {})
  );

  const existingEmails = uniqueUsers.map((u) => u.phone_number);

  const existingPhoneSet = new Set(
    uniqueUsers.map((u) => String(u.phone_number).replace(/\D/g, ""))
  );

  const newUsers = users.filter(
    (u) => !existingPhoneSet.has(String(u.phone_number).replace(/\D/g, ""))
  );

  // Insert new users
  let insertedUsers = [];
  if (newUsers.length > 0) {
    insertedUsers = await User.insertMany(newUsers);
  }

  // Combine all user IDs
  const allUserIds = [
    ...uniqueUsers.map((u) => u._id),
    ...insertedUsers.map((u) => u._id),
  ];

  console.log({
    existingPhoneSet,
    existingEmails,
    uniqueUsers,
    insertedUsers,
    allUserIds,
  });

  // Assign to survey
  await Survey.findByIdAndUpdate(surveyId, {
    $addToSet: { users: { $each: allUserIds } },
  });

  console.log(`Assigned ${allUserIds.length} users to survey ${surveyId}`);
});

exports.scheduleSurveyJobs = async (survey) => {
  await agenda.start();

  // Remove existing jobs for this survey
  await agenda.cancel({ "data.surveyId": survey._id });

  const now = new Date();

  let parsedDate = null;

  let uniqueKey = {};

  // Schedule initial send if startDate > now
  if (
    survey.startDate &&
    survey.startDate > now &&
    survey.startDate < survey.endDate
  ) {
    console.log({
      startDate: moment
        .tz(survey.startDate, "utc")
        .format("YYYY-MM-DDTHH:mm:ss[Z]"),
    });
    parsedDate = moment
      .tz(survey.startDate, "utc")
      .format("YYYY-MM-DDTHH:mm:ss[Z]");
    uniqueKey = {
      name: "scheduleSurveyJobs",
      "data.scheduleAt": parsedDate,
      "data.users": survey.users,
      "data.type": "initial",
    };

    const job = await agenda.jobs(uniqueKey);

    await agenda.schedule(
      parsedDate,
      "send survey",
      {
        surveyId: survey._id,
        type: "initial",
      },
      {
        unique: uniqueKey,
      }
    );
  }
  // else {
  //   // If startDate <= now, send immediately
  //   await agenda.now("send survey", { surveyId: survey._id, type: "initial" });
  // }

  // Schedule reminders if dates exist and > now
  if (
    survey.firstReminder &&
    survey.firstReminder > now &&
    survey.firstReminder < survey.endDate
  ) {
    // const parsedDate = moment.utc(survey.firstReminder).toDate();
    parsedDate = moment
      .tz(survey.firstReminder, "utc")
      .format("YYYY-MM-DDTHH:mm:ss[Z]");
    console.log({
      firstReminder: parsedDate,
    });

    uniqueKey = {
      name: "scheduleSurveyJobs",
      "data.scheduleAt": parsedDate,
      "data.users": survey.users,
      "data.type": "firstReminder",
    };

    const job = await agenda.jobs(uniqueKey);

    await agenda.schedule(
      parsedDate,
      "send survey",
      {
        surveyId: survey._id,
        type: "firstReminder",
      },
      {
        unique: uniqueKey,
      }
    );
  }
  if (
    survey.secondReminder &&
    survey.secondReminder > now &&
    survey.secondReminder < survey.endDate
  ) {
    // const parsedDate = moment.utc(survey.secondReminder).toDate();
    parsedDate = moment
      .tz(survey.secondReminder, "utc")
      .format("YYYY-MM-DDTHH:mm:ss[Z]");
    console.log({
      secondReminder: parsedDate,
    });

    uniqueKey = {
      name: "scheduleSurveyJobs",
      "data.scheduleAt": parsedDate,
      "data.users": survey.users,
      "data.type": "secondReminder",
    };

    const job = await agenda.jobs(uniqueKey);

    await agenda.schedule(
      parsedDate,
      "send survey",
      {
        surveyId: survey._id,
        type: "secondReminder",
      },
      {
        unique: uniqueKey,
      }
    );
  }
};

// exports.scheduleInsertSurveyUsersJobs = async (chunks, survey) => {
//   await agenda.start(); // ensure agenda is started

//   for (const chunk of chunks) {
//     console.log({
//       chunk,
//     });
//     await agenda.now("assign users to survey", {
//       surveyId: survey._id.toString(),
//       users: chunk,
//     });
//   }
// };

exports.scheduleInsertSurveyUsersJobs = async (chunks, survey) => {
  await agenda.start(); // ensure agenda is started

  for (const chunk of chunks) {
    const normalizedUsers = chunk.map((rawUser) =>
      normalizeUser(rawUser, survey.name)
    );

    console.log({
      normalizedUsers,
    });
    await agenda.now("assign users to survey", {
      surveyId: survey._id.toString(),
      users: normalizedUsers,
    });
  }
};

const normalizeUser = (rawUser, surveyId) => {
  const lowerCasedKeys = {};
  for (const key in rawUser) {
    lowerCasedKeys[key.toLowerCase().replace(/\s|_/g, "")] = rawUser[key];
  }

  return {
    name:
      rawUser.name ||
      lowerCasedKeys.name ||
      rawUser.phone_number ||
      rawUser.phone ||
      lowerCasedKeys.phonenumber ||
      "",
    username:
      rawUser.username ||
      lowerCasedKeys.username ||
      lowerCasedKeys.name ||
      rawUser.phone_number ||
      rawUser.phone ||
      lowerCasedKeys.phonenumber ||
      "",
    phone_number:
      rawUser.phone_number ||
      rawUser.phone ||
      lowerCasedKeys.phonenumber || // handles 'Phone Number', 'phone_number', 'phone number', etc.
      "",
    platform: "whatsapp",
    isAdmin: false,
    added_from: `survey_${surveyId}`,
  };
};

exports.cancleSurveyJobs = async (survey) => {
  // Remove existing jobs for this survey
  await agenda.cancel({ "data.surveyId": survey._id });
};

// module.exports = scheduleSurveyJobs;
