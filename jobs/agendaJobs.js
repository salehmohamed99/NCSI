const User = require("../models/userModel");
const Message = require("../models/messageModel");
const DoneJobs = require("../models/doneJobsModel");
const JobsLog = require("../models/jobsLogModel");
const axiosHelper = require("../helpers/axiosHelper");
const BlackList = require("../models/blackListModel");
const WhatsappLogController = require("../controllers/whatsappLogController");
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const Agenda = require("agenda");
const app = require("../app");

// const DATABASE =
//   "mongodb+srv://egila:<PASSWORD>@cluster0.n2tpdmf.mongodb.net/agenda?retryWrites=true&w=majority";

const DATABASE = process.env.DB_URI;
console.log({ DATABASE });
const DB = DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);
// const DB = DATABASE;

const agenda = new Agenda({
  db: { address: DB },
  processEvery: "30 seconds", // Interval at which Agenda will query the MongoDB database for jobs
  defaultConcurrency: 5, // Number of jobs that can be running at the same moment
  maxConcurrency: 20, // Maximum number of jobs that can be running simultaneously
  defaultLockLifetime: 10000, // Time in milliseconds after which a lock on a job will expire
  lockLifetime: 60000, // Adjust the lock lifetime as necessary,
  timezone: "UTC", // Use UTC for scheduling jobs
});
console.log({
  agenda,
});
agenda.define(
  "sendTemplateMessage",
  { lockLifetime: 10000 },
  async function (job) {
    const jobData = job.attrs.data;
    const jobId = job.attrs._id;
    let newItem = [];
    let newMsg = [];

    console.log({
      jobData,
    });
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
      for (let idx = 0; idx < jobData.users.length; idx++) {
        let id = jobData.users[idx]["id"]
          ? jobData.users[idx]["id"]
          : jobData.users[idx];
        console.log({
          idx,
          id,
        });

        let userTo = await User.findOne({ _id: id });

        let isUserInBlackList = await BlackList.findOne({
          phoneNumber: userTo.phone_number,
        });
        console.log({
          isUserInBlackList,
          userTo,
          messageType: jobData.type,
          phoneNumber: userTo.phone_number,
          u: jobData.users[idx],
        });
        if (isUserInBlackList) {
        } else {
          let reqData = {
            content: jobData.content,
            type: jobData.type,
            seen: jobData.seen,
            from: jobData.from,
            to: id,
            is_scheduled: jobData.is_scheduled,
          };

          console.log({
            reqData,
            body: jobData,
          });
          const isSentBefore = await JobsLog.findOne({
            job_id: jobId,
            phone_number: userTo.phone_number,
          });
          if (isSentBefore) {
            console.log(
              "#########################################################"
            );
            console.log(
              "--------------------------[ this message sent to user before ]-----------------------"
            );
            console.log(
              "#########################################################"
            );
          } else {
            let resDataUser;
            try {
              await JobsLog.create({
                job_id: jobId,
                phone_number: userTo.phone_number,
              });
              resDataUser = await saveMessage(reqData);
              console.log({
                resDataUser,
              });
            } catch (err) {
              console.log({
                err,
              });
            }

            newItem = resDataUser["to"];
            newMsg = resDataUser["newMsg"];
            if (jobData.platform === "whatsapp") {
              console.log({
                newItem,
              });
              jobData.to = newItem.phone_number;
              jobData.username = newItem.user_name;
              jobData.msg_id = newMsg._id;
              console.log("sendToWhatsapp");
              try {
                await sendToWhatsapp(jobData);
              } catch (err) {
                console.log({ err });
              }
            }
          }
        }
      }
    }
  }
);

agenda.define("importURL", async function (job) {
  console.log("Job started at", new Date());
  const jobData = job.attrs.data;
  console.log({
    jobData,
  });
  let filteredDta = [];
  jobData.forEach(async (item) => {
    if (
      item.name &&
      item.phone &&
      item.name != "null" &&
      item.phone != "null"
    ) {
      filteredDta.push([item.name, item.phone]);
    }
  });

  console.log(filteredDta);

  const response = await insertUsers(filteredDta, "url");

  console.log("Job completed at", new Date());
});

agenda.define("sendMessage", async function (job) {
  console.log("Job started at", new Date());
  const jobData = job.attrs.data;
  let newItem = [];
  let newMsg = [];
  let resDataUser = await saveMessage(jobData);
  console.log({
    resDataUser,
  });
  newItem = resDataUser["to"];

  newMsg = resDataUser["newMsg"];

  if (jobData.platform === "whatsapp") {
    jobData.username = newItem.user_name;
    jobData.to = newItem.phone_number;

    jobData.msg_id = newMsg._id;

    console.log("sendToWhatsapp");
    try {
      await sendToWhatsapp(jobData);
    } catch (err) {
      console.log({ err });
    }
  }

  console.log("Job completed at", new Date());

  // else if (req.body.platform === "instagram") {
  //   jobData.to = newItem.phone_number;
  //   console.log("sendToInstagram");

  //   await sendTo(InstagramjobData);

  // }
});

agenda.define("campaigns", async function (job) {
  console.log("Job started at", new Date());
  const jobData = job.attrs.data;
  const jobId = job.attrs._id;
  console.log({
    jobData,
  });
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
    let filteredDta = [];
    jobData["data"].forEach(async (item) => {
      if (
        item.full_name &&
        item.mobile &&
        item.full_name != "null" &&
        item.mobile != "null"
      ) {
        filteredDta.push([item.full_name, item.mobile]);
      }
    });

    console.log(filteredDta);

    const response = await insertUsers(filteredDta, jobData["campaign"]);

    console.log("Job completed at", new Date());
  }
});

// agenda.define('updateRecentMessages', async (job) => {
//   console.log('updateRecentMessages');
//     try {
//       const recentMessagesPipeline = [
//         { $sort: { createdAt: -1 } },
//         {
//           $group: {
//             _id: '$userId',
//             recentMessage: { $first: '$$ROOT' },
//           },
//         },
//         {
//           $merge: {
//             into: 'userRecentMessages',
//             whenMatched: 'replace',
//             whenNotMatched: 'insert',
//           },
//         },
//       ];

//       await Message.aggregate(recentMessagesPipeline);

//       console.log('Recent messages updated successfully.');
//     } catch (error) {
//       console.error('Error updating recent messages:', error);
//     }
//   });

async function saveMessage(message) {
  console.log("saveMessage", {
    message,
  });
  const newItem = await Message.create(message);

  if (message.parentMsg) {
    const parentMsg = await Message.findOne({ wa_msg_id: message.parentMsg });
    newItem.parent = parentMsg;
  }
  newItem.to = message.to;
  newItem.from = message.from;

  await newItem.save();
  const userFrom = await User.findById(message.from).populate({
    path: "messages",
    populate: {
      path: "parent",
      model: "Message",
    },
  });
  const userTo = await User.findById(message.to).populate({
    path: "messages",
    populate: {
      path: "parent",
      model: "Message",
    },
  });

  userTo.messages.push(newItem);
  userFrom.messages.push(newItem);

  await userTo.save();
  await userFrom.save();

  return {
    newMsg: newItem,
    to: userTo,
    from: userFrom,
  };
}

async function sendToWhatsapp(inputData) {
  console.log(
    {
      inputData,
    },
    "Icoooooming Dataaa"
  );
  const userData = await User.findOne({ phone_number: inputData.to });
  inputData.userName = inputData.name;
  const url =
    "https://graph.facebook.com/v12.0/" +
    WHATSAPP_PHONE_NUMBER_ID +
    "/messages?access_token=" +
    WHATSAPP_TOKEN;
  let data = {};
  data.messaging_product = "whatsapp";
  if (inputData.msgType === "media") {
    data.to = inputData.to;
    data.type = inputData.type;
    data[inputData.type] = {
      id: inputData.mediaId,
      filename: inputData.filename,
    };
    const wa_res = await axiosHelper.post(url, data);
    const message = await Message.findByIdAndUpdate(
      inputData.msg_id,
      { wa_msg_id: wa_res.data.messages[0].id },
      {
        new: true,
        runValidators: true,
      }
    );
    console.log({
      wa_res_contacts: wa_res.data.contacts,
      wa_res_messages: wa_res.data.messages,
      message,
    });
  } else if (inputData.type === "text") {
    data.to = inputData.to.toString();
    data.recipient_type = "individual";
    data.type = "text";
    data.text = {
      preview_url: false,
      body: inputData.content,
    };
    if (inputData.parentMsg) {
      data.context = {
        message_id: inputData.parentMsg,
      };
    }
    console.log({ data }, "teeeeeeeeeeeeeeest");
    const wa_res = await axiosHelper.post(url, data);
    const message = await Message.findByIdAndUpdate(
      inputData.msg_id,
      { wa_msg_id: wa_res.data.messages[0].id },
      {
        new: true,
        runValidators: true,
      }
    );
    console.log({
      wa_res_contacts: wa_res.data.contacts,
      wa_res_messages: wa_res.data.messages,
      message,
    });
  } else if (inputData.type === "sample_test") {
    let components = [];
    data.type = "template";
    // inputData.users.forEach(async (user) => {
    data.to = inputData.to;
    inputData.products.forEach(async (product) => {
      components = [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: product.thumb,
                // id: 1336178280655809
              },
            },
          ],
        },
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: inputData.username,
            },
            {
              type: "text",
              text: product.name,
            },
            {
              type: "text",
              text: product.price,
            },
            {
              type: "text",
              text: "ريال",
            },
          ],
        },
      ];
      data.template = {
        name: "sample_test",
        language: {
          code: "ar",
        },
        components,
      };
      console.log({
        data,
      });
      try {
        const wa_res = await axiosHelper.post(url, data);
        console.log("000000", {
          wa_res: wa_res.data.messages[0],
        });
        const message = await Message.findByIdAndUpdate(
          inputData.msg_id,
          { wa_msg_id: wa_res.data.messages[0].id },
          {
            new: true,
            runValidators: true,
          }
        );
      } catch (err) {
        console.log({ err });
      }
    });
    // });
  } else if (inputData.type === "confirm_order") {
    data.type = "interactive";
    data.recipient_type = "individual";
    data.to = inputData.to;
    if (inputData.parentMsg) {
      data.context = {
        message_id: inputData.parentMsg,
      };
    }
    data.interactive = {
      type: "button",
      body: {
        text: inputData.content,
      },
      action: {
        buttons: [
          {
            type: "reply",
            reply: {
              id: inputData.parentMsg,
              title: "نعم استمر في الشراء",
            },
          },
          {
            type: "reply",
            reply: {
              id: inputData.orderId,
              title: "لا",
            },
          },
        ],
      },
    };
    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
      const message = await Message.findByIdAndUpdate(
        inputData.msg_id,
        { wa_msg_id: wa_res.data.messages[0].id },
        {
          new: true,
          runValidators: true,
        }
      );
    } catch (err) {
      console.log({ err });
    }
    // });
    // });
  } else if (inputData.type === "products_catalog") {
    let components = [];
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;
    data.template = {
      name: "products_catalog",
      language: {
        code: "ar",
      },
      components: [
        {
          type: "button",
          sub_type: "CATALOG",
          index: 0,
          parameters: [
            {
              type: "action",
              action: {
                thumbnail_product_retailer_id: "",
              },
            },
          ],
        },
      ],
    };
    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
      const message = await Message.findByIdAndUpdate(
        inputData.msg_id,
        { wa_msg_id: wa_res.data.messages[0].id },
        {
          new: true,
          runValidators: true,
        }
      );
    } catch (err) {
      console.log({ err });
    }
    // });
  } else if (inputData.type === "gov_service_evaluation2") {
    data.type = "template";
    data.recipient_type = "individual";
    data.to = inputData.to;

    data.template = {
      name: "gov_service_evaluation2",
      language: {
        code: "ar",
      },
      components: [
        {
          type: "header",
          parameters: [
            {
              type: "image",
              image: {
                link: "https://cdn.glitch.global/c3a3c395-251d-41d1-8acd-20a3c6d2c0ca/Gov%20Service%20Evaluation.jpg?v=1741806778352",
              },
            },
          ],
        },
        {
          type: "button",
          sub_type: "flow",
          index: "0",
          parameters: [
            {
              type: "action",
              action: {
                flow_token: "1196439608707528",
                flow_action_data: {
                  screen: "QUESTION_ONE",
                  data: {
                    time: "timeData",
                  },
                },
              },
            },
          ],
        },
      ],
    };

    console.log({ data }, "teeeeeeeeeeeeeeest");
    try {
      const wa_res = await axiosHelper.post(url, data);
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
    } catch (err) {
      console.log({ err });
    }
  } else {
    let components = [];
    data.type = "template";
    data.to = inputData.to;
    let parameters = [];
    console.log({
      variables: inputData.variables,
      header: inputData.header,
    });
    if (inputData.header.length > 0) {
      let headerData = {
        type: "header",
        parameters: inputData.header,
      };
      components.push(headerData);
    }
    if (inputData.variables.length > 0) {
      inputData.variables.forEach((variable) => {
        parameters.push({
          type: "text",
          text: variable,
        });
      });
      components.push({
        type: "body",
        parameters,
      });
    }
    // mponents = [
    //   {
    //     type: "body",
    //     parameters,
    //   },
    // ];
    data.template = {
      name: inputData.type,
      language: {
        code: inputData.language,
      },
      components,
    };
    console.log({
      data,
    });
    try {
      const wa_res = await axiosHelper.post(url, data);
      const dataLog = await WhatsappLogController.create(
        JSON.stringify(data, null, 2)
      );
      console.log("000000", {
        wa_res: wa_res.data.messages[0],
      });
      const message = await Message.findByIdAndUpdate(
        inputData.msg_id,
        { wa_msg_id: wa_res.data.messages[0].id },
        {
          new: true,
          runValidators: true,
        }
      );
    } catch (err) {
      console.log({ err });
      const dataLog = await WhatsappLogController.createError(
        JSON.stringify(err, null, 2)
      );
    }
  }
  return true;
}

async function insertUsers(data, addedFrom) {
  console.log(
    "####################################### insertUsers job ############################################",
    {
      length: data.length,
    }
  );
  let response = {
    messages: [],
    existedCount: 0,
    createdCount: 0,
  };

  let preparedData = {
    name: "",
    username: "",
    phone_number: "",
    platform: "whatsapp",
    isAdmin: false,
    added_from: addedFrom,
  };

  for (let idx = 0; idx < data.length; idx++) {
    // console.log({ data: data[idx] });

    if (data[idx][0] && data[idx][0] !== undefined) {
      preparedData = {
        name: data[idx][0],
        user_name: data[idx][0],
        phone_number: data[idx][1],
        platform: "whatsapp",
        isAdmin: false,
        added_from: addedFrom,
      };
      // console.log({ preparedData });

      const isExist = await User.findOne({
        phone_number: data[idx][1],
        platform: "whatsapp",
        added_from: addedFrom,
      });

      // console.log({
      //   isExist,
      // });

      if (isExist) {
        response.messages.push(`${data[idx][0]}: exists before`);
        response.existedCount += 1;
      } else {
        try {
          const newItem = await User.create(preparedData);
          response.messages.push(`${data[idx][0]}: created successfully`);
          response.createdCount += 1;
        } catch (err) {
          response.messages.push(`${data[idx][0]}: error in create`);
        }
      }
    }
  }
  app.ioObject.sockets.emit("campaignsNotification", { response });
  console.log({
    response,
  });
  return response;
}
module.exports = agenda;
