const axios = require("axios").default;
const token = process.env.WHATSAPP_TOKEN;
const User = require("../models/userModel");
const Message = require("../models/messageModel");
const Setting = require("../models/settingModel");
const BlackList = require("../models/blackListModel");
const Orders = require("../models/ordersModel");
const WHATSAPP_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const axiosHelper = require("../helpers/axiosHelper");
const fs = require("fs");
const messageController = require("../controllers/messageController");
const thawaniController = require("../controllers/thawaniController");
const WebhookLogController = require("../controllers/WebhookLogController");
const sendToWhatsapp = require("./sendToWhatsapp");
const BASE_URL = process.env.BASE_URL;
const OrderID = require("../models/OrderIDModel");
const path = require("path");


const SurveyResponse = require('../models/surveyResponseModel'); // path to your model
const Survey = require('../models/surveyModel')
const mongoose = require('mongoose');

exports.postHandler = async (req, res) => {
  // Parse the request body from the POST
  let body = req.body;

  console.log("Test");
  // Check the Incoming webhook message
  console.log(JSON.stringify(req.body, null, 2));

  // const WebhookLog = await WebhookLogController.create(
  //   JSON.stringify(req.body, null, 2)
  // );
  // info on WhatsApp text message payload: https://developers.facebook.com/docs/whatsapp/cloud-api/webhooks/payload-examples#text-messages

  if (req.body.object === "whatsapp_business_account") {
    if (req.body.entry[0].changes[0].value.statuses) {
      console.log({
        is_phone_number_id: +req.body.entry[0].changes[0].value.metadata.phone_number_id ===
          WHATSAPP_PHONE_NUMBER_ID,
        test: req.body.entry[0].changes[0].value.metadata.phone_number_id,
        en: WHATSAPP_PHONE_NUMBER_ID
      })
      if (
        req.body.entry[0].changes[0].value.metadata.phone_number_id ===
        WHATSAPP_PHONE_NUMBER_ID
      ) {
        const WebhookLog = await WebhookLogController.create(
          JSON.stringify(req.body, null, 2)
        );
      }

      const ws_msg_id = req.body.entry[0].changes[0].value.statuses[0].id;
      if (req.body.entry[0].changes[0].value.statuses[0].status === "failed") {
        const errorMsg =
          req.body.entry[0].changes[0].value.statuses[0].errors[0].error_data
            .details;

        if (
          req.body.entry[0].changes[0].value.metadata.phone_number_id ===
          WHATSAPP_PHONE_NUMBER_ID
        ) {
          const WebhookLog = await WebhookLogController.createWebhookFailedLog(
            JSON.stringify(req.body, null, 2)
          );
        }

        await messageController.sendStatus(ws_msg_id, "failed", errorMsg);

        await messageController.deleteMessageByWaID(ws_msg_id);
      } else if (
        req.body.entry[0].changes[0].value.statuses[0].status === "sent"
      ) {
        await messageController.sendStatus(ws_msg_id, "sent", "sent");
      } else if (
        req.body.entry[0].changes[0].value.statuses[0].status === "delivered"
      ) {
        await messageController.sendStatus(ws_msg_id, "delivered", "delivered");
      } else if (
        req.body.entry[0].changes[0].value.statuses[0].status === "read"
      ) {
        await messageController.sendStatus(ws_msg_id, "read", "read");
      }
    }

    ////////////////////////////// Make Order ///////////////////////////////////
    if (
      req.body.entry[0].changes[0].value.messaging_product &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0].type == "text"
    ) {
      let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
      let name = req.body.entry[0].changes[0].value.contacts[0].profile.name; // extract the phone number from the webhook payload
      let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
      let parentMsg = req.body.entry[0].changes[0].value.messages[0].context
        ? req.body.entry[0].changes[0].value.messages[0].context.id
        : null;
      if (
        req.body.entry[0].changes[0].value.messages[0].text.body == "تيست"
      ) {
        // smart = await OrderID.findOneAndUpdate(
        //   { from: from },
        //   { $set: { smart: "of", wa_msg_id: wa_msg_id } },
        //   { new: true, upsert: true }
        // );
        const wellcomeData = {
          from: "00",
          to: from,
          phone_number: from,
          questions: [
            // {
            //   question: "ما مدى رضاك عن الخدمة المقدمة؟",
            //   type: "radio",
            //   answers: ["راضٍ جدًا", "راضٍ", "محايد", "غير راضٍ"]
            // },
            // {
            //   question: "هل تنصح الآخرين باستخدام خدماتنا؟",
            //   type: "radio",
            //   answers: ["نعم", "لا"]
            // },
            // {
            //   question: "كيف كانت تجربتك بشكل عام؟",
            //   type: "radio",
            //   answers: ["ممتازة", "جيدة", "متوسطة", "سيئة"]
            // },
            // {
            //   question: "كيف كانت سهولة استخدام الموقع؟",
            //   type: "radio",
            //   answers: ["سهلة جدًا", "سهلة", "صعبة", "صعبة جدًا"]
            // },
            // {
            //   question: "هل كانت الأسعار مناسبة؟",
            //   type: "radio",
            //   answers: ["نعم", "لا", "غير متأكد"]
            // },
            // {
            //   question: "ما تقييمك لجودة المنتجات؟",
            //   type: "radio",
            //   answers: ["عالية", "متوسطة", "منخفضة"]
            // },
            // {
            //   question: "كيف تقيم سرعة التوصيل؟",
            //   type: "radio",
            //   answers: ["سريعة جدًا", "مقبولة", "بطيئة"]
            // },
            // {
            //   question: "هل كان الموظفون متعاونين؟",
            //   type: "radio",
            //   answers: ["نعم جدًا", "إلى حد ما", "لا"]
            // },
            // {
            //   question: "هل كانت التعليمات واضحة؟",
            //   type: "radio",
            //   answers: ["نعم", "بعض الشيء", "لا"]
            // },
            // {
            //   question: "هل واجهت أي صعوبات في الطلب؟",
            //   type: "radio",
            //   answers: ["لا", "نعم، بسيطة", "نعم، كثيرة"]
            // },
            // {
            //   question: "هل تخطط لاستخدام خدماتنا مرة أخرى؟",
            //   type: "radio",
            //   answers: ["بالتأكيد", "ربما", "لا"]
            // },
            // {
            //   question: "ما مدى سرعة استجابتنا لاستفسارك؟",
            //   type: "radio",
            //   answers: ["سريعة", "عادية", "بطيئة"]
            // },
            {
              question: "1",
              type: "radio",
              answers: ["نعم", "لا"]
            },
            {
              question: "2",
              type: "radio",
              answers: ["نعم", "لا"]
            },
            // {
            //   question: "هل الخدمة تلبي احتياجاتك؟",
            //   type: "radio",
            //   answers: ["تمامًا", "جزئيًا", "لا"]
            // },
            // {
            //   question: "ما الذي تود تحسينه؟",
            //   type: "text",
            //   answers: []
            // },
            // {
            //   question: "هل لديك أي اقتراحات لتطوير الخدمة؟",
            //   type: "text",
            //   answers: []
            // },
            // {
            //   question: "ما أكثر شيء أعجبك في تجربتك معنا؟",
            //   type: "text",
            //   answers: []
            // },
            // {
            //   question: "هل هناك شيء لم يعجبك في الخدمة؟",
            //   type: "text",
            //   answers: []
            // },
            // {
            //   question: "ما هي ملاحظاتك على فريق الدعم؟",
            //   type: "text",
            //   answers: []
            // },
            // {
            //   question: "هل لديك أفكار لمنتجات أو خدمات جديدة؟",
            //   type: "text",
            //   answers: []
            // },
            // {
            //   question: "ما الذي تتمنى إضافته في المستقبل؟",
            //   type: "text",
            //   answers: []
            // },
            // {
            //   question: "كيف كانت تجربتك العامة بشكل مفصل؟",
            //   type: "text",
            //   answers: []
            // },
            // {
            //   question: "هل هناك تفاصيل إضافية تود مشاركتها؟",
            //   type: "text",
            //   answers: []
            // },
            // {
            //   question: "ما هي مقترحاتك لتحسين تجربة المستخدم؟",
            //   type: "text",
            //   answers: []
            // },
            // {
            //   question: "هل هناك تفاصيل إضافية تود مشاركتها؟",
            //   type: "text",
            //   answers: []
            // },
            // {
            //   question: "ما هي مقترحاتك لتحسين تجربة المستخدم؟",
            //   type: "text",
            //   answers: []
            // }
          ],
          users: ["201097006369"],
          type: "dynamic_test",
          survey_id: "686a80ea54735205602d4c93",
          userId: "6867fa392ccc5a0d94c6f3fc",
          source: "initial"
          // type: "taresh_create_flow",
        };

        sendToWhatsapp.sendToWhatsapp(wellcomeData);


      }
    }
    else if (
      req.body.entry[0].changes[0].value.messaging_product === "whatsapp" &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0].type === "interactive" &&
      req.body.entry[0].changes[0].value.messages[0].interactive.nfm_reply &&
      req.body.entry[0].changes[0].value.messages[0].interactive.nfm_reply
        .name === "flow"
    ) {
      let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload

      let response_json = JSON.parse(
        req.body.entry[0].changes[0].value.messages[0].interactive.nfm_reply
          .response_json
      );
      const existingOrder = await OrderID.findOne({ from: from });


      if (response_json.flow_token === "583011828184612") {
        const parsedResponse = response_json;

        if (
          Array.isArray(existingOrder?.questionsArray) &&
          typeof existingOrder?.payload_data === "object"
        ) {
          existingOrder.questionsArray = existingOrder.questionsArray.map((qObj) => {
            const key = Object.keys(qObj)[0];
            const answer = parsedResponse[key];

            if (answer !== undefined && answer !== null) {
              let answerText = answer;

              if (key.startsWith("Choose_")) {
                const chooseIndex = key.split("_")[1];
                const options = existingOrder.payload_data[`Choose_data_${chooseIndex}`];

                if (Array.isArray(options)) {
                  const matchedOption = options.find((opt) => opt.id === answer);
                  if (matchedOption) {
                    answerText = matchedOption.title;
                  }
                }
              } else if (key.startsWith("Rate_")) {
                if (Array.isArray(answer)) {
                  answerText = answer[0];
                }
              }

              return {
                [key]: qObj[key],
                answer: answerText,
              };
            }

            return qObj;
          });
        }

        await existingOrder.save();
        console.log("✅ تم حفظ الإجابات النصية داخل questionsArray");

        // تحميل الاستبيان
        const survey = await Survey.findById(response_json.survey_id);
        if (!survey) throw new Error("Survey not found");

        // تحويل الأسئلة إلى مصفوفة answers باستخدام العناوين
        const answers = existingOrder.questionsArray.map((qObj) => {
          const key = Object.keys(qObj)[0];
          const questionTitle = qObj[key];
          const answerText = qObj.answer;

          const matchedQuestion = survey.questions.find(
            (q) => q.question?.trim() === questionTitle?.trim()
          );

          if (!matchedQuestion) {
            console.warn(`⚠️ لم يتم العثور على السؤال بعنوان "${questionTitle}"`);
            return null;
          }

          return {
            questionId: matchedQuestion._id.toString(),
            answer: answerText
          };
        }).filter(Boolean); // إزالة nulls

        console.log(answers);

        await saveSurveyResponse({
          surveyId: response_json.survey_id,
          userId: response_json.userId,
          source: response_json.source,
          answers
        });
      }





    }
    // else if (
    //   req.body.entry[0].changes[0].value.messaging_product &&
    //   req.body.entry[0].changes[0].value.messages[0].type == "order"
    // ) {
    //   let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
    //   let name = req.body.entry[0].changes[0].value.contacts[0].profile.name; // extract the phone number from the webhook payload
    //   let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
    //   let parentMsg = req.body.entry[0].changes[0].value.messages[0].context
    //     ? req.body.entry[0].changes[0].value.messages[0].context.id
    //     : null;
    //   let catalog_id =
    //     req.body.entry[0].changes[0].value.messages[0].order.catalog_id;
    //   let product_items =
    //     req.body.entry[0].changes[0].value.messages[0].order.product_items;
    //   let msg = "هل تريد الاستمرار في عملية الشراء هذه ؟";

    //   const adminId = await User.findOne({ platform: "admin" });
    //   const user = await User.findOne({ phone_number: from });

    //   const order = await Orders.create({
    //     product_items,
    //     catalog_id,
    //     wa_msg_id,
    //     from: user,
    //     to: adminId,
    //   });
    //   await order.save();

    //   const saveMessageOrder = {
    //     from: user,
    //     to: adminId,
    //     content: "make_order",
    //     wa_msg_id: wa_msg_id,
    //     type: "make_order",
    //   };

    //   messageController.saveMessage22(saveMessageOrder);

    //   const wellcomeData = {
    //     from: adminId,
    //     to: user,
    //     phone_number: from,
    //     content: msg,
    //     parentMsg: wa_msg_id,
    //     orderId: order._id,
    //     type: "confirm_order",
    //   };

    //   messageController.sendWellcomeMessage(wellcomeData);
    // } 
    // else if (
    //   req.body.entry[0].changes[0].value.messaging_product &&
    //   req.body.entry[0].changes[0].value.messages[0].type == "interactive" &&
    //   req.body.entry[0].changes[0].value.messages[0].interactive.type ==
    //   "button_reply" &&
    //   req.body.entry[0].changes[0].value.messages[0].interactive.button_reply
    //     .title == "نعم استمر في الشراء"
    // ) {
    //   let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
    //   let name = req.body.entry[0].changes[0].value.contacts[0].profile.name; // extract the phone number from the webhook payload
    //   let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
    //   let parentMsg = req.body.entry[0].changes[0].value.messages[0].context
    //     ? req.body.entry[0].changes[0].value.messages[0].context.id
    //     : null;
    //   let orderMsg_id =
    //     req.body.entry[0].changes[0].value.messages[0].interactive.button_reply
    //       .id;
    //   // let msg = "رابط الدفع";

    //   // const adminId = await User.findOne({ platform: "admin" });
    //   // const user = await User.findOne({ phone_number: from });

    //   // const wellcomeData = {
    //   //   from: adminId,
    //   //   to: user,
    //   //   phone_number: from,
    //   //   content: msg,
    //   //   // parentMsg: wa_msg_id,
    //   //   type: "text",
    //   // };

    //   // messageController.sendWellcomeMessage(wellcomeData);

    //   await thawaniController.createThawaniSession(
    //     orderMsg_id,
    //     { customerName: name },
    //     from
    //   );
    // }
    ////////////////////////////// Make Order ///////////////////////////////////
    else if (
      req.body.entry &&
      req.body.entry[0].changes &&
      req.body.entry[0].changes[0] &&
      req.body.entry[0].changes[0].value.messages &&
      req.body.entry[0].changes[0].value.messages[0]
    ) {
      // const response = await axios.post(
      //   "https://smarterp.top/api/v1.0/products/index?token=YjMyY2JjZjc5ZDUxOTYxMTNiNDc0MTNjYmRiZWMzMjk=&company=demo_oman",
      //   {
      //     limit: 1000000000000,
      //   }
      // );
      // const data = response["data"]["data"];
      let from = req.body.entry[0].changes[0].value.messages[0].from; // extract the phone number from the webhook payload
      let name = req.body.entry[0].changes[0].value.contacts[0].profile.name; // extract the phone number from the webhook payload
      let wa_msg_id = req.body.entry[0].changes[0].value.messages[0].id;
      let parentMsg = req.body.entry[0].changes[0].value.messages[0].context
        ? req.body.entry[0].changes[0].value.messages[0].context.id
        : null;
      let msgType = req.body.entry[0].changes[0].value.messages[0].type;

      // console.log(response);
      // console.log(response["data"]["data"][0]["name"]);
      let msg = null;
      let caption = null;
      let type = null;
      if (msgType === "button") {
        let btnType =
          req.body.entry[0].changes[0].value.messages[0].button.payload;
        if (btnType === "إيقاف عمليات الترويج") {
          // let parentMessage = await Message.findOne({ wa_msg_id: parentMsg });
          msg = "إيقاف عمليات الترويج";
          type = "text";
          let isExistInBlackList = await BlackList.findOne({
            // messageType: parentMessage.type,
            phoneNumber: from,
          });
          if (!isExistInBlackList) {
            let blackList = await BlackList.create({
              //messageType: parentMessage.type,
              phoneNumber: from,
            });
            console.log({
              blackList,
              //type: parentMessage ? parentMessage.type : "image_sale_template",
              from,
            });
          } else {
            console.log({
              isExistInBlackList,
            });
          }
        }
      } else if (
        req.body.entry[0].changes[0].value.messages[0].type === "text"
      ) {
        msg = req.body.entry[0].changes[0].value.messages[0].text.body;
        type = req.body.entry[0].changes[0].value.messages[0].type;


      } else {
        type = req.body.entry[0].changes[0].value.messages[0].type;
        caption = req.body.entry[0].changes[0].value.messages[0][type]['caption'] ? req.body.entry[0].changes[0].value.messages[0][type]['caption'] : '';
        const url =
          "https://graph.facebook.com/v17.0/" +
          req.body.entry[0].changes[0].value.messages[0][type].id;
        msg = `${req.body.entry[0].changes[0].value.messages[0].type} Message`;
        //`attachments/${wa_msg_id}-${from}.${ext}`
        let config = {
          method: "get",
          maxBodyLength: Infinity,
          keepExtensions: true,
          url,
          headers: {
            "Content-Type": "application/json",
            // responseType: 'arraybuffer' ,
            Authorization: `Bearer ${token}`,
          },
        };

        try {
          // response = await axios.post(url, {data:formData} , config);
          let response = await axios.request(config);

          // fs.unlink(`${inputData.file.name}`);

          // response = await fetch(url, {method: 'POST', body: formData });
          config.url = response.data.url;
          config["responseType"] = "arraybuffer";
          response = await axios.request(config);
          console.log({
            data: response.data,
          });
          const ext = response.headers["content-type"].split("/")[1];

          // const buffer = Buffer.from(response.data, "base64");
          fs.writeFileSync(
            `attachments/${wa_msg_id}-${from}.${ext}`,
            response.data
          );

          msg = `${BASE_URL}/attachments/${wa_msg_id}-${from}.${ext}`;
          console.log({ msg, type });

          // console.log("File written successfully\n");
          // n successfully\n");
          // console.log("The written has the following contents:");
          // console.log(fs.readFileSync(`attachments/eg.jpg`, "utf8"));
        } catch (err) {
          console.log({
            err: err,
          });
        }
      }

      const user = await User.findOne({ phone_number: from });
      const adminId = await User.findOne({ platform: "admin" });
      if (user) {
        const userLastMsg = await Message.findOne(
          { from: adminId._id, to: user._id },
          null,
          {
            sort: { createdAt: -1 },
          }
        );

        // To set two dates to two variables
        let today = new Date();
        let msgDate = userLastMsg ? new Date(userLastMsg.createdAt) : today;
        let isUserExistInBlackList = await BlackList.findOne({
          // messageType: parentMessage.type,
          phoneNumber: from,
        });
        // To calculate the time difference of two dates
        let Difference_In_Time = today.getTime() - msgDate.getTime();

        // To calculate the no. of days between two dates
        let Difference_In_Days = Difference_In_Time / (1000 * 3600 * 24);

        console.log("##@@@@@@@@", {
          from: adminId._id,
          to: user._id,
          Difference_In_Days
        });
        if (!isUserExistInBlackList && Difference_In_Days >= 1 || Difference_In_Days == 0) {
          console.log(
            "<<<<<<<<<<<<<<<<<<< wellcome >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>"
          );
          const wellcomeMsg = await Setting.findOne({
            key: "wellcome_message",
          });
          console.log({
            wellcomeMsg,
          });
          const wellcomeData = {
            from: adminId,
            to: user,
            phone_number: from,
            content: wellcomeMsg ? wellcomeMsg.value : "Wellcome To our application",
            type: "text",
          };

          messageController.sendWellcomeMessage(wellcomeData);
        }
      }

      const dataToDashboard = {
        phone_number: from,
        content: msg,
        caption,
        type,
        name: name ? name : from,
        user_name: name ? name : from,
        platform: "whatsapp",
        wa_msg_id,
        parentMsg,
      };

      messageController.sendMessage(dataToDashboard);
      // io.emit("newmsg", { msg, phone_number: from });
      //       for (let i = 0; i < 3; i++) {
      //         const element = data[i];
      //         let productName = data[i]["name"];
      //         let productPrice = data[i]["price"];
      //         const productThumbnail = data[i]["thumb"];

      //         let phone_number_id =
      //           req.body.entry[0].changes[0].value.metadata.phone_number_id;

      //         let msg_body = req.body.entry[0].changes[0].value.messages[0].text.body; // extract the message text from the webhook payload

      //         await axios({
      //           method: "POST", // Required, HTTP method, a string, e.g. POST, GET
      //           url:
      //             "https://graph.facebook.com/v12.0/" +
      //             phone_number_id +
      //             "/messages?access_token=" +
      //             token,
      //           data: {
      //             messaging_product: "whatsapp",
      //             to: from,
      //             //   text: { body: "Ack: " + msg_body  },
      //             //             text: {
      //             //               body: `القي نظرة على منتجنا:
      //             // *${products}* بسعر: ${productPrice} ريال,
      //             //   . لمزيد من المنتجات قم بزيارة الرابط التالي👇
      //             // https://www.facebook.com/MuscatApps`,
      //             //             },
      //             // type: "template",
      //             // template: {
      //             //   name: "hello_world",
      //             //   language: {
      //             //     code: "en_US",
      //             //   },
      //             // },
      //             type: "template",
      //             template: {
      //               name: "sample_test",
      //               language: {
      //                 code: "ar",
      //               },
      //               components: [
      //                 {
      //                   type: "header",
      //                   parameters: [
      //                     {
      //                       type: "image",
      //                       image: {
      //                         link: productThumbnail,
      //                       },
      //                     },
      //                   ],
      //                 },
      //                 {
      //                   type: "body",
      //                   parameters: [
      //                     {
      //                       type: "text",
      //                       text: from,
      //                     },
      //                     {
      //                       type: "text",
      //                       text: productName,
      //                     },
      //                     {
      //                       type: "text",
      //                       text: productPrice,
      //                     },
      //                     {
      //                       type: "text",
      //                       text: "ريال",
      //                     },
      //                   ],
      //                 },
      //               ],
      //             },
      //           },
      //           headers: { "Content-Type": "application/json" },
      //         });
      //       }
    }

    res.sendStatus(200);
  } else if (req.body.object === "instagram") {
    const page_id = process.env.PAGE_ID;
    const token = process.env.INSTAGRAM_TOKEN;

    if (req.body.entry[0].changes) {
      if (req.body.entry[0].changes[0].field === "comments") {
        const comment_id = req.body.entry[0].changes[0].value.id;
        const commentText = req.body.entry[0].changes[0].value.text;
        const from = req.body.entry[0].changes[0].value.from.id;
        const username = req.body.entry[0].changes[0].value.from.username;

        // const url =
        //   "https://graph.facebook.com/" + from + "?access_token=" + token;
        // let instaUser;
        // try {
        //   instaUser = await axiosHelper.get(url);
        //   console.log({
        //     req: req.body,
        //     instaUser,
        //   });
        // } catch (err) {
        //   console.log({ err });
        // }

        if (from !== "17841408513191477") {
          const dataToDashboard = {
            phone_number: from,
            content: `Comment event message content: ${commentText}`,
            user_name: username,
            name: username,

            platform: "instagram",
          };
          messageController.sendMessage(dataToDashboard);
        }
        const message = "Thanks for reaching out, how can I help?";

        const newUrl = `https://graph.facebook.com/${page_id}/messages?access_token=${token}`;

        const data = {
          recipient: { comment_id: comment_id },
          message: { text: message },
        };
        console.log({
          data,
          commentText,
        });
        try {
          const instaRes = await axiosHelper.post(newUrl, data);
          console.log({
            instaRes,
          });
        } catch (err) {
          console.log({ err });
        }
      }
    } else {
      if (req.body.entry[0].messaging[0].message) {
        const from = req.body.entry[0].messaging[0].sender.id;
        const content = req.body.entry[0].messaging[0].message.text;

        const url =
          "https://graph.facebook.com/" + from + "?access_token=" + token;

        const instaUser = await axiosHelper.get(url);

        console.log({
          req: req.body,
          instaUser,
        });

        if (instaUser.data.id !== "17841408513191477") {
          const dataToDashboard = {
            phone_number: from,
            content,
            user_name: instaUser.data.userName,
            name: instaUser.data.name,

            platform: "instagram",
          };
          messageController.sendMessage(dataToDashboard);
        }
      }
    }
  } else {
    // Return a '404 Not Found' if event is not from a WhatsApp API
    res.sendStatus(404);
  }
};

exports.getHandler = async (req, res) => {
  console.log("getHandler");
  /**
   * UPDATE YOUR VERIFY TOKEN
   *This will be the Verify Token value when you set up webhook
   **/
  const verify_token = process.env.VERIFY_TOKEN;

  // Parse params from the webhook verification request
  let mode = req.query["hub.mode"];
  let token = req.query["hub.verify_token"];
  let challenge = req.query["hub.challenge"];

  console.log({
    verify_token,
    mode,
    token,
    challenge
  });
  // Check if a token and mode were sent
  if (mode && token) {
    // Check the mode and token sent are correct
    if (mode === "subscribe" && token === verify_token) {
      // Respond with 200 OK and challenge token from the request
      console.log("WEBHOOK_VERIFIED");
      res.status(200).send(challenge);
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
};

exports.patchHandler = async (req, res) => {
  console.log("patchHandler =>> ", {
    req,
  });
};




async function saveSurveyResponse({ surveyId, userId, source, answers }) {
  try {
    const response = new SurveyResponse({
      survey: new mongoose.Types.ObjectId(surveyId),
      user: new mongoose.Types.ObjectId(userId),
      source: source || 'initial',
      respondedAt: new Date(),
      answers: answers.map(ans => ({
        questionId: new mongoose.Types.ObjectId(ans.questionId),
        answer: ans.answer
      }))
    });

    await response.save();
    // Increment responseCount on the survey
    await Survey.findByIdAndUpdate(surveyId, { $inc: { responseCount: 1 } });

    console.log("Survey response saved and responseCount incremented.");
    return response;
  } catch (error) {
    if (error.code === 11000) {
      console.error('User already responded to this survey.');
    } else {
      console.error('Failed to save survey response:', error);
    }
    throw error;
  }
}

