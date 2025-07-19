// const TemplateLog = require("../models/TemplateLog");

const BlackList = require("../models/blackListModel");
const Message = require("../models/messageModel");

const User = require("../models/userModel");
const axios = require("axios").default;
const axiosHelper = require("../helpers/axiosHelper");
const WhatsappLogController = require("../controllers/whatsappLogController");

const Setting = require("../models/settingModel");
const TemplateLog = require("../models/templateLogModel");

const multer = require("multer");
const fs = require("fs");
var FormData = require("form-data");
const app = require("../app");

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;

const WHATSAPP_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const INSTAGRAM_TOKEN = process.env.INSTAGRAM_TOKEN;
const INSTAGRAM_PAGE_ID = process.env.PAGE_ID;
const schedule = require("../jobs/scheduleJobs");

// console.log(schedule);
exports.getAllMessages = async (req, res) => {
  let response = {
    statusCode: 200,
    body: null,
  };

  try {
    const messages = await Message.find();
    response.statusCode = 200;
    response.body = {
      reqAt: req.reqTime,
      status: "success",
      results: messages.length,
      data: {
        messages,
      },
    };
  } catch (err) {
    response.statusCode = 404;
    response.body = {
      status: "fail",
      message: err,
    };
  } finally {
    res.status(response.statusCode).json(response.body);
  }
};

exports.getMessage = async (req, res) => {
  let response = {
    statusCode: 200,
    body: null,
  };

  try {
    const message = await Message.findById(req.params.id);
    response.body = {
      status: "success",
      data: {
        message,
      },
    };
  } catch (err) {
    response.statusCode = 404;
    response.status = "fail";
    response.message = err;

    response.body = {
      status: "fail",
      message: err,
    };
  } finally {
    res.status(response.statusCode).json(response.body);
  }
};
//sendWellcomeMessage
exports.sendWellcomeMessage = async (payload) => {
  const res = await this.saveMessage(payload);

  payload["msg_id"] = res["newMsg"]._id;
  payload["to"] = res["to"].phone_number;

  const send = await this.sendToWhatsapp(payload);
  return true;
};
exports.sendMessage = async (payload) => {
  const {
    phone_number,
    content,
    caption,
    type,
    user_name,
    name,
    platform,
    wa_msg_id,
    parentMsg,
  } = payload;

  console.log({
    payload,
  });
  let user = await User.findOne({ phone_number: phone_number });
  let admin = await User.findOne({ platform: "admin" });

  console.log("#####################################################");
  console.log({
    user,
  });

  console.log("#####################################################");

  const message = {
    content,
    caption,
    wa_msg_id,
    parentMsg,
    type,
    seen: false,
    from: null,
    to: admin._id,
  };

  let resData = null;
  // saveMessage('abcd');
  if (user) {
    message.from = user._id;

    // console.log({ io: app.ioObject });
    resData = await this.saveMessage(message);
  } else {
    const newUserData = {
      name,
      user_name,
      platform,
      phone_number,
      added_from: "conversation",
    };
    user = await User.create(newUserData);
    const adminId = await User.findOne({ platform: "admin" });
    const wellcomeMsg = await Setting.findOne({ key: "wellcome_message" });
    console.log({
      wellcomeMsg,
    });
    const wellcomeData = {
      from: adminId,
      to: user,
      phone_number: user.phone_number,
      content: wellcomeMsg ? wellcomeMsg.value : "Wellcome To our application",
      type: "text",
    };

    message.from = user._id;

    // console.log({ io: app.ioObject });
    resData = await this.saveMessage(message);

    this.sendWellcomeMessage(wellcomeData);
    // console.log({newUser});
  }

  // message.from = user._id;

  // // console.log({ io: app.ioObject });
  // let resData = await this.saveMessage(message);

  let fromUser = [resData["from"]];
  console.log({
    fromUser,
  });

  fromUser = fromUser.map((item) => {
    return {
      id: item.id,
      name: item.name,
      phone_number: item.phone_number,
      platform: item.platform,
      seen: resData["newMsg"].seen,
      added_from: item.added_from,
      // createdAt: resData["newMsg"][createdAt]
      messages: [resData["newMsg"]],
    };
  });

  // delete fromUser.messages;
  // fromUser['message'] = message
  app.ioObject.sockets.emit("chat", { fromUser });
  // ioObject.emit("chat", "how are you");

  return "ok";
};

exports.sendStatus = async (wa_msg_id, status, statusMsg) => {
  console.log({
    wa_msg_id: wa_msg_id,
  });

  // let msg = await Message.findOne({ wa_msg_id: wa_msg_id }).populate({
  //   path: "from",
  // });

  let msg = await Message.findOneAndUpdate(
    { wa_msg_id: wa_msg_id },
    { status: status },
    {
      new: true,
      runValidators: true,
    }
  );

  console.log({ msg });
  if (msg) {
    //     let templateLog = await TemplateLog.findOne({
    //       template_name: msg.type,
    //       date: getDate(),
    //     });
    //     console.log({ templateLog, msg });

    //     if (templateLog) {
    //       templateLog[status] += 1;
    //       templateLog.save();
    //     } else {
    //       let templateLog = await TemplateLog.create({
    //         template_name: msg.type,
    //         date: getDate(),
    //       });
    //       templateLog[status] += 1;
    //       templateLog.save();
    //     }
    app.ioObject.sockets.emit("status", { msg, status, statusMsg });
  }

  return "ok";
};

// exports.createMessage = async (req, res) => {
//   try {
//     let newItem = [];
//     let newMsg = [];
//     if (req.body.messageType === "template") {
//       console.log({
//         length: req.body.users.length,
//       });
//       schedule.sendTemplateMessage(req.body);
//       //       for (let idx = 0; idx < req.body.users.length; idx++) {
//       //         let id = req.body.users[idx]["id"]
//       //           ? req.body.users[idx]["id"]
//       //           : req.body.users[idx];
//       //         console.log({
//       //           idx,
//       //           id,
//       //           // length: req.body.users.length,
//       //         });

//       //         let userTo = await User.findOne({ _id: id });

//       //         let isUserInBlackList = await BlackList.findOne({
//       //           phoneNumber: userTo.phone_number,
//       //         });
//       //         console.log({
//       //           isUserInBlackList,
//       //           userTo,
//       //           messageType: req.body.type,
//       //           phoneNumber: userTo.phone_number,
//       //           u: req.body.users[idx],
//       //         });
//       //         if (isUserInBlackList) {
//       //         } else {
//       //           let reqData = {
//       //             content: req.body.content,
//       //             type: req.body.type,
//       //             seen: req.body.seen,
//       //             from: req.body.from,
//       //             to: id,
//       //           };

//       //           console.log({
//       //             reqData,
//       //             body: req.body,
//       //           });
//       //           let resDataUser;
//       //           try {
//       //             resDataUser = await saveMessage(reqData);
//       //             console.log({
//       //               resDataUser,
//       //             });
//       //           } catch (err) {
//       //             console.log({
//       //               err,
//       //             });
//       //           }

//       //           newItem = resDataUser["to"];
//       //           newMsg = resDataUser["newMsg"];
//       //           if (req.body.platform === "whatsapp") {
//       //             console.log({
//       //               newItem,
//       //             });
//       //             req.body.to = newItem.phone_number;
//       //             req.body.username = newItem.user_name;
//       //             req.body.msg_id = newMsg._id;
//       //             console.log("sendToWhatsapp");
//       //             try {
//       //               await sendToWhatsapp(req.body);
//       //             } catch (err) {
//       //               console.log({ err });
//       //               res.status(400).json({
//       //                 status: "fail",
//       //                 user: "sendToWhatsapp",
//       //                 message: err,
//       //               });
//       //             }
//       //           }
//       //         }
//       //       }
//     }
//     else {
//       console.log({
//         body: req.body
//       });
// //       let resDataUser = await this.saveMessage(req.body);
// //       console.log({
// //         resDataUser,
// //       });
// //       newItem = resDataUser["to"];

// //       newMsg = resDataUser["newMsg"];

// //       if (req.body.platform === "whatsapp") {
// //         req.body.username = newItem.user_name;
// //         req.body.to = newItem.phone_number;

// //         req.body.msg_id = newMsg._id;

// //         console.log("sendToWhatsapp");
// //         try {
// //           await this.sendToWhatsapp(req.body);
// //         } catch (err) {
// //           res.status(400).json({
// //             status: "fail",
// //             user: "sendToWhatsapp",
// //             message: err,
// //           });
// //         }
// //       } else if (req.body.platform === "instagram") {
// //         req.body.to = newItem.phone_number;
// //         console.log("sendToInstagram");

// //         await sendToInstagram(req.body);
// //       }
//     }

//     res.status(201).json({
//       status: "success",

//       data: {
//         message: newMsg,
//       },
//     });
//   } catch (err) {
//     console.log({err})
//     res.status(400).json({
//       status: "fail",
//       user: "egila",
//       message: err,
//     });
//   }
// };

exports.createMessage = async (req, res) => {
  try {
    let newItem = [];
    let newMsg = [];
    if (req.body.messageType === "template") {
      console.log({
        body: req.body,
        length: req.body.users.length,
      });
      schedule.sendTemplateMessage(req.body);
    } else {
      if (req.body.is_scheduled) {
        schedule.sendMessage(req.body);
      } else {
        let resDataUser = await this.saveMessage(req.body);
        console.log({
          resDataUser,
        });
        newItem = resDataUser["to"];

        newMsg = resDataUser["newMsg"];

        if (req.body.platform === "whatsapp") {
          req.body.username = newItem.user_name;
          req.body.to = newItem.phone_number;

          req.body.msg_id = newMsg._id;

          console.log("sendToWhatsapp");
          try {
            const waRes = await this.sendToWhatsapp(req.body);
          } catch (err) {
            res.status(400).json({
              status: "fail",
              user: "sendToWhatsapp",
              message: err,
            });
          }
        } else if (req.body.platform === "instagram") {
          req.body.to = newItem.phone_number;
          console.log("sendToInstagram");

          await sendToInstagram(req.body);
        }
      }

      
    }
    res.status(201).json({
        status: "success",

        data: {
          message: newMsg,
        },
      });
  } catch (err) {
    console.log({ err });
    res.status(400).json({
      status: "fail",
      user: "egila",
      message: err,
    });
  }
};

exports.updateMessage = async (req, res) => {
  let response = {
    statusCode: 200,
    body: null,
  };

  try {
    const message = await Message.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    response.body = {
      status: "success",
      data: {
        message,
      },
    };
  } catch (err) {
    response.statusCode = 404;
    response.status = "fail";
    response.message = err;

    response.body = {
      status: "fail",
      message: err,
    };
  } finally {
    res.status(response.statusCode).json(response.body);
  }
};

exports.deleteMessageByWaID = async (wa_msg_id) => {
  const msg1 = await Message.deleteOne({ wa_msg_id: wa_msg_id });
};

exports.deleteMessage = (req, res) => {
  let response = {
    statusCode: 200,
    status: "success",
    data: "deleted",
  };

  res.status(response.statusCode).json({
    status: response.status,
    data: response.data,
  });
};

exports.saveMessage22 = async (message) => {
  console.log("saveMessage", {
    message,
  });
  const newItem = await Message.create(message);

  if (message.parentMsg) {
    const parentMsg = await Message.findOne({ wa_msg_id: message.parentMsg });
    newItem.parent = parentMsg;
  }
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
};

exports.saveMessage = async function (message) {
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
};

exports.sendToWhatsapp = async function (inputData) {
  console.log(
    {
      inputData,
    },
    "Icoooooming Dataaa"
  );
  const userData = await User.findOne({ phone_number: inputData.to });
  inputData.userName = inputData.name;
  const url =
    "https://graph.facebook.com/v17.0/" +
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
     let wa_res = null;
    try{
      wa_res = await axiosHelper.post(url, data);
      
    }catch(e){
      console.log({e});
    }
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
  }
  //   else if (inputData.type === "image_template") {
  //     const imageTemplateSetting = await Setting.findOne({
  //       key: "image-template",
  //     });
  //     console.log({
  //       imageTemplateSetting: imageTemplateSetting.value,
  //     });
  //     let components = [];
  //     data.type = "template";
  //     // inputData.users.forEach(async (user) => {
  //     data.to = inputData.to;
  //     // inputData.products.forEach(async (product) => {
  //     components = [
  //       {
  //         type: "header",
  //         parameters: [
  //           {
  //             type: "image",
  //             image: {
  //               id: imageTemplateSetting.value,
  //             },
  //           },
  //         ],
  //       },
  //     ];
  //     data.template = {
  //       name: "image_template",
  //       language: {
  //         code: "ar",
  //       },
  //       components,
  //     };
  //     console.log({
  //       data,
  //     });
  //     try {
  //       const wa_res = await axiosHelper.post(url, data);
  //       console.log("000000", {
  //         wa_res: wa_res.data.messages[0],
  //       });
  //       const message = await Message.findByIdAndUpdate(
  //         inputData.msg_id,
  //         { wa_msg_id: wa_res.data.messages[0].id },
  //         {
  //           new: true,
  //           runValidators: true,
  //         }
  //       );
  //     } catch (err) {
  //       console.log({ err });
  //     }
  //     // });
  //     // });
  //   }
  //   else if (inputData.type === "pdf_template" ){
  //     let components = [];
  //     data.type = "template";
  //     // inputData.users.forEach(async (user) => {
  //     data.to = inputData.to;
  //      let parameters = inputData.variables;
  //     // inputData.products.forEach(async (product) => {
  //     components = [
  //       {
  //         type: "header",
  //         parameters: [
  //           {
  //             type: "document",
  //             document: {
  //               link:  inputData.header[0],
  //               filename: 'Document'
  //             },
  //           },
  //         ],
  //       },
  //     ];
  //     data.template = {
  //       name: "pdf_template",
  //       language: {
  //         code: "ar",
  //       },
  //       components,
  //     };
  //     console.log({
  //       data,
  //     });
  //     try {
  //       const wa_res = await axiosHelper.post(url, data);
  //       console.log("000000", {
  //         wa_res: wa_res.data.messages[0],
  //       });
  //       const message = await Message.findByIdAndUpdate(
  //         inputData.msg_id,
  //         { wa_msg_id: wa_res.data.messages[0].id },
  //         {
  //           new: true,
  //           runValidators: true,
  //         }
  //       );
  //     } catch (err) {
  //       console.log({ err });
  //     }
  //     // });
  //     // });
  //   }
  //   else if (inputData.type === "custom_product") {
  //     let components = [];
  //     data.type = "template";
  //     // inputData.users.forEach(async (user) => {
  //     data.to = inputData.to;
  //     // inputData.products.forEach(async (product) => {
  //     components = [
  //       {
  //         type: "header",
  //         parameters: [
  //           {
  //             type: "image",
  //             image: {
  //               // link: "https://smarterp.top/assets/uploads/0028f305a16b8a1bf6b14f4c92317f86.jpg",
  //               link: "https://smarterp.top/assets/uploads/bf24b052ed3fb6783c0bc7a27af4850a.jpg",
  //             },
  //           },
  //         ],
  //       },
  //       {
  //         type: "body",
  //         parameters: [
  //           {
  //             type: "text",
  //             // text: "د. حميد بن محمد البوسعيدي",
  //             text: "راشد بن خميس بن زايد الخالدي",
  //           },
  //           {
  //             type: "text",
  //             // text: "مرشح عن ولاية المضيبي  *د. حميد بن محمد البوسعيدي.*  دعوة للناخبين بضرورة التسجيل في السجل الانتخابي فهو يضمن حقكم في التصويت، واختيار من ترونه مناسبًا ليمثلكم ويمثل الولاية بفاعلية في مجلس الشورى.   سارع الآن و حمل تطبيق انتخاب وسجل في السجل الانتخابي قبل تاريخ *2023/8/31* برنامج انتخاب :  https://onelink.to/ecrt8j للمساعدة تواصل بالاتصال أو على الواتساب على الأرقام التالية: *للرجال:* 98829882  *للنساء:* 98829882 صوتك أمانة فأحسنوا الاختيار  ",
  //             // text:"المرشح عن ولاية المضيبي.  دعوة للناخبين بضرورة التسجيل في السجل الانتخابي فهو يضمن حقكم في التصويت،   واختيار من ترونه مناسبًا ليمثلكم ويمثل الولاية بفاعلية في مجلس الشوري  سارع الآن و حمل تطبيق انتخاب وسجل في السجل الانتخابي قبل تاريخ   *2023/8/31*   للمساعدة تواصل بالاتصال أو على الواتساب على الأرقام التالية   *للرجال:*  98829882   *للنساء:*  98829882    صوتك أمانة فأحسنوا الاختيار"
  //             text: "مترشح  لعضوية مجلس الشورى للدورة العاشرة عن ولاية صحم",
  //           },
  //         ],
  //       },
  //       // {
  //       // "type": "button",
  //       // "sub_type" : "url",
  //       //"index": "0",
  //       // "parameters": [
  //       // {
  //       //     "type": "text",
  //       //
  //       //     "text": "#"
  //       // }
  //       // ]
  //       // },
  //       //],
  //       //},
  //     ];
  //     data.template = {
  //       name: "custom_product",
  //       language: {
  //         code: "ar",
  //       },
  //       components,
  //     };
  //     console.log({
  //       data,
  //     });
  //     try {
  //       const wa_res = await axiosHelper.post(url, data);
  //       console.log("000000", {
  //         wa_res: wa_res.data.messages[0],
  //       });
  //       const message = await Message.findByIdAndUpdate(
  //         inputData.msg_id,
  //         { wa_msg_id: wa_res.data.messages[0].id },
  //         {
  //           new: true,
  //           runValidators: true,
  //         }
  //       );
  //     } catch (err) {
  //       console.log({ err });
  //     }
  //     // });
  //     // });
  //   }
  //   else if (inputData.type === "custom_template") {
  //     let components = [];
  //     data.type = "template";
  //     // inputData.users.forEach(async (user) => {
  //     data.to = inputData.to;
  //     inputData.products.forEach(async (product) => {
  //       components = [
  //         {
  //           type: "header",
  //           parameters: [
  //             {
  //               type: "image",
  //               image: {
  //                 // link: "https://smarterp.top/assets/uploads/0028f305a16b8a1bf6b14f4c92317f86.jpg",
  //                 link: product.image,
  //               },
  //             },
  //           ],
  //         },
  //         {
  //           type: "body",
  //           parameters: [
  //             {
  //               type: "text",
  //               // text: "د. حميد بن محمد البوسعيدي",
  //               text: product.name,
  //             },
  //             {
  //               type: "text",
  //               // text: "مرشح عن ولاية المضيبي  *د. حميد بن محمد البوسعيدي.*  دعوة للناخبين بضرورة التسجيل في السجل الانتخابي فهو يضمن حقكم في التصويت، واختيار من ترونه مناسبًا ليمثلكم ويمثل الولاية بفاعلية في مجلس الشورى.   سارع الآن و حمل تطبيق انتخاب وسجل في السجل الانتخابي قبل تاريخ *2023/8/31* برنامج انتخاب :  https://onelink.to/ecrt8j للمساعدة تواصل بالاتصال أو على الواتساب على الأرقام التالية: *للرجال:* 98829882  *للنساء:* 98829882 صوتك أمانة فأحسنوا الاختيار  ",
  //               // text:"المرشح عن ولاية المضيبي.  دعوة للناخبين بضرورة التسجيل في السجل الانتخابي فهو يضمن حقكم في التصويت،   واختيار من ترونه مناسبًا ليمثلكم ويمثل الولاية بفاعلية في مجلس الشوري  سارع الآن و حمل تطبيق انتخاب وسجل في السجل الانتخابي قبل تاريخ   *2023/8/31*   للمساعدة تواصل بالاتصال أو على الواتساب على الأرقام التالية   *للرجال:*  98829882   *للنساء:*  98829882    صوتك أمانة فأحسنوا الاختيار"
  //               text: product.symbol,
  //             },
  //           ],
  //         },
  //         // {
  //         // "type": "button",
  //         // "sub_type" : "url",
  //         //"index": "0",
  //         // "parameters": [
  //         // {
  //         //     "type": "text",
  //         //
  //         //     "text": "#"
  //         // }
  //         // ]
  //         // },
  //         //],
  //         //},
  //       ];
  //       data.template = {
  //         name: "custom_template",
  //         language: {
  //           code: "ar",
  //         },
  //         components,
  //       };
  //       console.log({
  //         data,
  //       });
  //       try {
  //         const wa_res = await axiosHelper.post(url, data);
  //         console.log("000000", {
  //           wa_res: wa_res.data.messages[0],
  //         });
  //         const message = await Message.findByIdAndUpdate(
  //           inputData.msg_id,
  //           { wa_msg_id: wa_res.data.messages[0].id },
  //           {
  //             new: true,
  //             runValidators: true,
  //           }
  //         );
  //       } catch (err) {
  //         console.log({ err });
  //       }
  //     });
  //     // });
  //   }
  //   else if (inputData.type === "election_template") {
  //     let components = [];
  //     data.type = "template";
  //     // inputData.users.forEach(async (user) => {
  //     data.to = inputData.to;
  //     let parameters = [];
  //     // inputData.products.forEach(async (product) => {
  //     inputData.variables.forEach((variable) => {
  //       parameters.push({
  //         type: "text",
  //         text: variable,
  //       });
  //     });
  //     components = [
  //       {
  //         type: "header",
  //         parameters: [
  //           {
  //             type: "image",
  //             image: {
  //               link: inputData.header[0]
  //                 ? inputData.header[0]
  //                 : "https://smarterp.top/assets/uploads/no_image.png",
  //             },
  //           },
  //         ],
  //       },
  //       {
  //         type: "body",
  //         parameters,
  //       },
  //     ];
  //     data.template = {
  //       name: "election_template",
  //       language: {
  //         code: "ar",
  //       },
  //       components,
  //     };
  //     console.log({
  //       data,
  //     });
  //     try {
  //       const wa_res = await axiosHelper.post(url, data);
  //       console.log("000000", {
  //         wa_res: wa_res.data.messages[0],
  //       });
  //       const message = await Message.findByIdAndUpdate(
  //         inputData.msg_id,
  //         { wa_msg_id: wa_res.data.messages[0].id },
  //         {
  //           new: true,
  //           runValidators: true,
  //         }
  //       );
  //     } catch (err) {
  //       console.log({ err });
  //     }
  //     // });
  //     // });
  //   }
  //   else if (inputData.type === "video_offer" || inputData.type === "video_offer_website") {
  //     let components = [];
  //     data.type = "template";
  //     // inputData.users.forEach(async (user) => {
  //     data.to = inputData.to;
  //     let parameters = [];
  //     // inputData.products.forEach(async (product) => {
  //     inputData.variables.forEach((variable) => {
  //       parameters.push({
  //         type: "text",
  //         text: variable,
  //       });
  //     });
  //     components = [
  //       {
  //         type: "header",
  //         parameters: [
  //           {
  //             type: "video",
  //             video: {
  //               link: inputData.header[0]
  //                 ? inputData.header[0]
  //                 : "https://smarterp.top/assets/uploads/no_image.png",
  //             },
  //           },
  //         ],
  //       },
  //       {
  //         type: "body",
  //         parameters,
  //       },
  //     ];
  //     data.template = {
  //       name: inputData.type,
  //       language: {
  //         code: "ar",
  //       },
  //       components,
  //     };
  //     console.log({
  //       data,
  //     });
  //     try {
  //       const wa_res = await axiosHelper.post(url, data);
  //       console.log("000000", {
  //         wa_res: wa_res.data.messages[0],
  //       });
  //       const message = await Message.findByIdAndUpdate(
  //         inputData.msg_id,
  //         { wa_msg_id: wa_res.data.messages[0].id },
  //         {
  //           new: true,
  //           runValidators: true,
  //         }
  //       );
  //     } catch (err) {
  //       console.log({ err });
  //     }
  //     // });
  //     // });
  //   }
  //   else if (inputData.type === "humaid_template") {
  //     let components = [];
  //     data.type = "template";
  //     // inputData.users.forEach(async (user) => {
  //     data.to = inputData.to;
  //     let parameters = [];
  //     // inputData.products.forEach(async (product) => {
  //     console.log({
  //       variables: inputData.variables,
  //     });
  //     inputData.variables.forEach((variable) => {
  //       parameters.push({
  //         type: "text",
  //         text: variable,
  //       });
  //     });
  //     components = [
  //       {
  //         type: "body",
  //         parameters,
  //       },
  //     ];
  //     data.template = {
  //       name: "humaid_template",
  //       language: {
  //         code: "ar",
  //       },
  //       components,
  //     };
  //     console.log({
  //       data,
  //     });
  //     try {
  //       const wa_res = await axiosHelper.post(url, data);
  //       const dataLog = await WhatsappLogController.create(
  //         JSON.stringify(inputData, null, 2)
  //       );
  //       console.log("000000", {
  //         wa_res: wa_res.data.messages[0],
  //       });
  //       const message = await Message.findByIdAndUpdate(
  //         inputData.msg_id,
  //         { wa_msg_id: wa_res.data.messages[0].id },
  //         {
  //           new: true,
  //           runValidators: true,
  //         }
  //       );
  //     } catch (err) {
  //       console.log({ err });
  //       const dataLog = await WhatsappLogController.createError(
  //         JSON.stringify(err, null, 2)
  //       );
  //     }
  //     // });
  //     // });
  //   }
  else if (inputData.type === "confirm_order") {
    // const url = `https://graph.facebook.com/16.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`;
    // "https://graph.facebook.com/v12.0/" +
    // WHATSAPP_PHONE_NUMBER_ID +
    // "/messages?access_token=" +
    // WHATSAPP_TOKEN;
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
};

async function sendToInstagram(inputData) {
  console.log({
    inputData,
  });
  const url =
    "https://graph.facebook.com/v16.0/" +
    INSTAGRAM_PAGE_ID +
    "/messages?access_token=" +
    INSTAGRAM_TOKEN;

  let data = {};

  if (inputData.type === "text") {
    data.recipient = {
      id: inputData.to,
    };

    data.message = {
      text: inputData.content,
    };

    try {
      console.log({
        url,
        data,
      });
      await axiosHelper.post(url, data);
    } catch (err) {
      console.log({ err });
    }
  } else if (inputData.type === "template") {
  }
  return true;
}

exports.getImage = async (req, res) => {
  const url = req.body.img_url;

  console.log({
    img_url: req.body.img_url,
    call: url,
  });
  try {
    const response = await axios.get(url, {
      responseType: "arraybuffer",
      headers: {
        Authorization: "Bearer " + WHATSAPP_TOKEN,
      },
    });
    console.log({
      response,
    });
    const b64 = new Buffer.from(response.data).toString("base64");
    // CHANGE THIS IF THE IMAGE YOU ARE WORKING WITH IS .jpg OR WHATEVER
    const mimeType = "image/jpg"; // e.g., image/png
    fs.writeFileSync("pic.jpg", response.data);
    res.send(`<img src="data:${mimeType};base64,${b64}" />`);
    // res.status(200).json({data: response.data});
  } catch (err) {
    console.log({
      err,
    });
  }
};

exports.attachmentMessage = async (req, res) => {
  const preparedData = [];
  const to = req.body.to;
  const client_id = req.body.client_id;
  

  const userTo = await User.findById(to);
  const userFrom = await User.findOne({ platform: "admin" });

  const key = "files";
  
  console.log({
    files: req.files, 
    req
  });
  
  if (Array.isArray(req.files["files[]"])) {
        console.log('attachmentMessage | 1');

    for (let idx = 0; idx < req.files["files[]"].length; idx++) {
      let data = {
        file: req.files["files[]"][idx],
        type: req.files["files[]"][idx].mimetype,
        messaging_product: "whatsapp",
      };

      let resData = await this.uploadMediaToWhatsapp(data, key);
      console.log({
        f: req.files["files[]"][0],
        type: await this.getAttchmentType(req.files["files[]"][idx].mimetype),
      });
      let type = await this.getAttchmentType(req.files["files[]"].mimetype);
      let test = {
        mediaId: resData.id,
        type,
        path: resData.path,
        filename: req.files["files[]"][idx].mimetype.name,
        client_id
      };
      if (type !== "document") delete test["filename"];

      preparedData.push(test);
    }
  } else {
        console.log('attachmentMessage | 2');

    let data = {
      file: req.files["files[]"],
      type: req.files["files[]"].mimetype,
      messaging_product: "whatsapp",
    };

    let resData = await this.uploadMediaToWhatsapp(data, key);
        console.log('attachmentMessage', {
          resData
        });

    let type = await this.getAttchmentType(req.files["files[]"].mimetype);

    let test = {
      mediaId: resData.data.id,
      path: resData.path,
      type,
      client_id,
      filename: req.files["files[]"].name,
    };

    if (type !== "document") delete test["filename"];
    console.log({test});

    preparedData.push(test);
  }

  for (let i = 0; i < preparedData.length; i++) {
    const msg = {
      from: userFrom._id,
      to: userTo._id,
      content: preparedData[i].path,
      seen: false,
      type: preparedData[i].type,
      client_id
    };
    const resData = await this.saveMessage(msg);

    preparedData[i]._id = resData["newMsg"]._id;

    let inData = {
      type: preparedData[i].type,
      filename: preparedData[i].filename,
      msgType: "media",
      to: userTo.phone_number,
      mediaId: preparedData[i].mediaId,
      msg_id: resData["newMsg"]._id,
    };

    await this.sendToWhatsapp(inData);
  }

  let response = {
    statusCode: 200,
    status: "success",
    data: preparedData,
  };
  
  console.log({
    data: response.data,
  })

  res.status(response.statusCode).json({
    status: response.status,
    data: response.data,
  });
};

exports.uploadImageTemplate = async (req, res) => {
  let data = {
    file: req.files.file,
    type: req.files.file.mimetype,
    messaging_product: "whatsapp",
  };
  const key = "image-template";

  let resData = await this.uploadMediaToWhatsapp(data, key);

  const value = resData.data.id;
  const path = resData.path;

  const setting = await Setting.findOne({
    key,
  });

  let targetData = [];

  if (setting) {
    targetData = await Setting.findOneAndUpdate(
      { key },
      { value },
      { path },
      {
        new: true,
        runValidators: true,
      }
    );
  } else {
    targetData = await Setting.create({ key, value });
  }

  let response = {
    statusCode: 200,
    status: "success",
    data: resData,
  };

  res.status(response.statusCode).json({
    status: response.status,
    message: "Template Image uploaded successfully",
    data: response.data,
  });
};

exports.getAttchmentType = async (mimeType) => {
  const FileMimeType = {
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      "document",
    "application/wspolicy+xml": "document",
    "application/x-compress": "document",
    "application/zip": "document",
    "application/postscript": "document",
    "application/x-aim": "document",
    "application/x-bcpio": "document",
    "application/octet-stream": "document",
    "text/html": "document",
    "application/x-cdf": "document",
    "application/pkix-cert": "document",
    "application/java": "document",
    "application/x-cpio": "document",
    "application/x-csh": "document",
    "text/css": "document",
    "application/msword": "document",
    "application/x-wais-source": "document",
    "application/x-netcdf": "document",
    "application/oda": "document",
    "application/vnd.oasis.opendocument.database": "document",
    "application/vnd.oasis.opendocument.chart": "document",
    "application/vnd.oasis.opendocument.formula": "document",
    "application/vnd.oasis.opendocument.graphics": "document",
    "application/vnd.oasis.opendocument.image": "document",
    "application/vnd.oasis.opendocument.text-master": "document",
    "application/vnd.oasis.opendocument.presentation": "document",
    "application/vnd.oasis.opendocument.spreadsheet": "document",
    "application/vnd.oasis.opendocument.text": "document",
    "application/vnd.oasis.opendocument.graphics-template": "document",
    "application/vnd.oasis.opendocument.text-web": "document",
    "application/vnd.oasis.opendocument.presentation-template": "document",
    "application/vnd.oasis.opendocument.spreadsheet-template": "document",
    "application/vnd.oasis.opendocument.text-template": "document",
    "application/ogg": "document",
    "application/xslt+xml": "document",
    "application/vnd.mozilla.xul+xml": "document",
    "application/vnd.visio": "document",
    "text/vnd.wap.wml": "document",
    "application/vnd.wap.wmlc": "document",
    "text/vnd.wap.wmlsc": "wmls",
    "application/vnd.wap.wmlscriptc": "document",
    "application/font-woff": "document",
    "application/font-woff2": "document",
    "application/xml-dtd": "document",
    "application/x-dvi": "document",
    "application/vnd.ms-fontobject": "document",
    "text/x-setext": "document",
    "application/x-gtar": "document",
    "application/x-gzip": "document",
    "application/x-hdf": "document",
    "application/mac-binhex40": "document",
    "text/x-component": "document",
    "text/vnd.sun.j2me.app-descriptor": "document",
    "application/java-archive": "document",
    "text/x-java-source": "document",
    "application/x-java-jnlp-file": "document",
    "application/javascript": "document",
    "text/plain": "document",
    "application/json": "document",
    "application/x-latex": "document",
    "application/x-font-opentype": "document",
    "application/annodex": "document",
    "application/xspf+xml": "document",
    "application/pdf": "document",
    "application/vnd.ms-powerpoint": "document",
    "application/rdf+xml": "document",
    "application/vnd.rn-realmedia": "document",
    "application/rtf": "document",
    "text/richtext": "document",
    "application/font-sfnt": "document",
    "application/x-sh": "document",
    "application/x-shar": "document",
    "application/x-stuffit": "document",
    "application/x-sv4cpio": "document",
    "application/x-sv4crc": "document",
    "application/x-shockwave-flash": "document",
    "application/x-tar": "document",
    "application/x-tcl": "document",
    "application/x-tex": "document",
    "application/x-texinfo": "document",
    "text/tab-separated-values": "document",
    "application/x-font-ttf": "document",
    "application/x-ustar": "document",
    "application/voicexml+xml": "document",
    "application/xhtml+xml": "document",
    "application/vnd.ms-excel": "document",
    "application/xml": "document",
    "text/troff": "document",
    "application/mathml+xml": "document",
    "application/x-mif": "document",

    "audio/x-mpeg": "audio",
    "audio/x-aiff": "audio",
    "audio/basic": "audio",
    "audio/midi": "audio",
    "audio/x-mpegurl": "audio",
    "audio/mpeg": "audio",
    "audio/ogg": "audio",
    "audio/flac": "audio",
    "audio/annodex": "audio",
    "audio/x-scpls": "audio",
    "audio/x-wav": "audio",

    "image/x-jg": "image",
    "image/bmp": "image",
    "image/gif": "image",
    "image/ief": "image",
    "image/jpeg": "image",
    "image/svg+xml": "image",
    "image/tiff": "image",
    "image/x-xbitmap": "image",
    "image/x-xpixmap": "image",
    "image/x-xwindowdump": "image",
    "image/vnd.wap.wbmp": "image",
    "image/x-portable-bitmap": "image",
    "image/pict": "image",
    "image/x-portable-graymap": "image",
    "image/png": "image",
    "image/x-portable-anymap": "image",
    "image/x-portable-pixmap": "image",
    "image/vnd.adobe.photoshop": "image",
    "image/x-quicktime": "image",
    "image/x-cmu-raster": "image",
    "image/x-rgb": "image",
    "image/x-macpaint": "image",

    "video/x-ms-asf": "video",
    "video/x-msvideo": "video",
    "video/x-rad-screenplay": "video",
    "video/x-dv": "video",
    "video/quicktime": "video",
    "video/x-sgi-movie": "video",
    "video/mp4": "video",
    "video/mpeg": "video",
    "video/mpeg2": "video",
    "video/ogg": "video",
    "video/annodex": "video",
    "video/x-ms-wmv": "video",
  };

  return FileMimeType[mimeType];
};

exports.uploadMediaToWhatsapp = async (inputData, key) => {
      console.log('uploadMediaToWhatsapp', {
        inputData, key
      });

  let response = null;
  const url =
    // https://graph.facebook.com/{{Version}}/{{Phone-Number-ID}}/media
    "https://graph.facebook.com/v17.0/" + WHATSAPP_PHONE_NUMBER_ID + "/media";

  let type = await this.getAttchmentType(inputData.file.mimetype);
  const base_url = process.env.BASE_URL;
  let dataName = inputData.file.name.split(".");
  let ext = dataName[dataName.length - 1];
let fileName = null;
  if(key === 'files')
     fileName = `${type}-${new Date().getTime()}.${ext}`;
  else 
    fileName = `${type}.${ext}`;
  let path = `attachments/${key}`;

  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
  fs.writeFileSync(`${path}/${fileName}`, inputData.file.data);
  let data = new FormData();
  data.append("file", fs.createReadStream(`${path}/${fileName}`));
  data.append("type", inputData.file.mimetype);
  data.append("messaging_product", "whatsapp");

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    keepExtensions: true,
    url,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${WHATSAPP_TOKEN}`,
      ...data.getHeaders(),
    },
    data: data,
  };

  try {
    // response = await axios.post(url, {data:formData} , config);
    response = await axios.request(config);

    // fs.unlink(`${inputData.file.name}`);

    // fs.unlink(`attachments/${inputData.file.name}`, (err) => {
    //   if (err) throw err;
    //   console.log(`${inputData.file.name}  was deleted`);
    // });

    // response = await fetch(url, {method: 'POST', body: formData });
    console.log({
      response,
      data: response.data,
      path: `${base_url}/${path}/${fileName}`
    });
  } catch (err) {
    console.log({
      err: err,
      
    });
  }

  return {
    data: response.data,
    path: `${base_url}/${path}/${fileName}`,
  };
};

exports.getTemplateStatus = async (req, res) => {
  const { template, start, end } = req.body;
  const whatsAppID = process.env.WHATS_APP_ID;
  const token = process.env.WHATSAPP_TOKEN;
  let statusCode = 200;
  let message = "template status retrived successfully";
  let success = true;
  let data = {};
  

  let templatesResult = null;
  //${whatsAppID}/message_templates?access_token=${token}
  const url = `https://graph.facebook.com/v18.0/${whatsAppID}/template_analytics?start=${start}&end=${end}&granularity=DAILY&metric_types=[%27SENT%27%2C%27DELIVERED%27%2C%27READ%27%2C%27CLICKED%27]&template_ids=[${template}]&access_token=${token}`;
  try {
    templatesResult = await axiosHelper.get(url);
  } catch (err) {
    console.log({ err: err });
    statusCode = err.response.status;
    message = err.response.data.error.error_data;
    success = false;
  }

  if (success){
    let delivered, sent, read = 0;
    data = {
      start,
      end,
      delivered: 0,
      sent: 0,
      read: 0
    };
    templatesResult.data.data[0]["data_points"].forEach(item => {
      data.delivered += item.delivered;
      data.sent += item.sent;
      data.read += item.read;
    })
  }
    // console.log({
    //   templatesResult: templatesResult.data.data[0]["data_points"],
    // });
  // const resData = await TemplateLog.find( { date: { $in: req.body.dates }, template_name:req.body.template });
  //  console.log({
  //   resData: resData
  // })
  res.status(statusCode).json({
    success,
    message,
    data: success ? [data] : [],
  });
};

function getDate() {
  let objectDate = new Date();

  let day = objectDate.getDate();

  let month = objectDate.getMonth();

  let year = objectDate.getFullYear();
  let format = year + "-" + month + "-" + day;
  return format;
}
