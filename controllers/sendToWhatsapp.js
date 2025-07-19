const axiosHelper = require("../helpers/axiosHelper");

const OrderID = require("../models/OrderIDModel");
const sendToWhatsapp = require("./sendToWhatsapp");
let WHATSAPP_PHONE_NUMBER_ID;
let WHATSAPP_TOKEN;

// const {
//   WHATSAPP_PHONE_NUMBER_ID,
//   WHATSAPP_TOKEN,
// } = require("./messageController");

exports.sendToWhatsapp = async (inputData) => {
    console.log(
        {
            inputData,
        },
        "Icoooooming Dataaa"
    );

    WHATSAPP_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
    WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;



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
    }

    else if (inputData.type === "dynamic_test") {
        const questionsArray = [];

        function convertQuestionsToData(questions) {
            const data = {};
            let Choose_index = 1;
            let Rate_index = 1;
            data.survey_id = inputData.survey_id ? inputData.survey_id : "123456";
            data.userId = inputData.userId ? inputData.userId : "123456";
            data.source = inputData.source ? inputData.source : "initial";

            const rate_data = Array.from({ length: 10 }, (_, i) => ({
                id: String(i + 1),
                title: String(i + 1),
            }));

            questions.forEach((item) => {
                if (item.type === "radio" && item.answers.length > 0) {
                    data[`Choose_data_${Choose_index}`] = item.answers.map((answer, idx) => ({
                        id: String(idx + 1),
                        title: answer,
                    }));
                    data[`Choose_label_${Choose_index}`] = item.question;
                    data[`Choose_visible_${Choose_index}`] = true;

                    questionsArray.push({
                        [`Choose_${Choose_index}`]: item.question,
                        answers: "",
                    });

                    Choose_index++;
                } else if (item.type === "text") {
                    data[`Rate_data_${Rate_index}`] = rate_data;
                    data[`Rate_label_${Rate_index}`] = item.question;
                    data[`Rate_visible_${Rate_index}`] = true;

                    questionsArray.push({
                        [`Rate_${Rate_index}`]: item.question,
                        answers: "",
                    });

                    Rate_index++;
                }
            });

            data.Choose_length = Choose_index - 1;
            data.Rate_length = Rate_index - 1;

            for (let i = Choose_index; i <= 20; i++) {
                data[`Choose_visible_${i}`] = false;
            }
            for (let i = Rate_index; i <= 20; i++) {
                data[`Rate_visible_${i}`] = false;
            }

            return data;
        }

        const payload_data = convertQuestionsToData(inputData.questions);
        console.log("Generated Payload Data:", payload_data);

        let user = await OrderID.findOne({ from: inputData.to });

        if (!user) {
            console.log("❌ User not found with number:", inputData.to);
            user = new OrderID({
                from: inputData.to,
                questionsArray,
                payload_data
            });
            await user.save();
        } else {
            console.log("User found with number:", inputData.to);
            user.questionsArray = questionsArray;
            user.payload_data = payload_data;
            await user.save();
        }



        // const wellcomeData = {
        //   from: "00",
        //   to: inputData.to,
        //   phone_number: inputData.to,
        //   payload_data,
        //   type: "dynamic_flow",
        // };
        // await sendToWhatsapp.sendToWhatsapp(wellcomeData);

        data.type = "template";
        data.recipient_type = "individual";
        data.to = inputData.to;

        data.template = {
            name: "flow_gov_service_evaluation_1",
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
                    type: "body",
                    parameters: [
                        {
                            type: "text",
                            text: inputData.name ? inputData.name : "تجربة",
                        },
                    ],
                },
                {
                    "type": "button",
                    "sub_type": "flow",
                    "index": "0",
                    "parameters": [
                        {
                            "type": "action",
                            action: {
                                flow_token: "583011828184612",
                                flow_action_data: payload_data,
                            },
                        }
                    ]
                }
            ],
        };
        // console.log(JSON.stringify(data, null, 2));



        console.log("🔁 Sending to:", inputData.to);
        try {
            const wa_res = await axiosHelper.post(url, data);
            console.log("✅ Sent:", {
                to: inputData.to,
                message_id: (wa_res && wa_res.data && wa_res.data.messages && wa_res.data.messages[0])
                    ? wa_res.data.messages[0].id
                    : null,
            });
        } catch (err) {
            const errorMsg = (err && err.response && err.response.data) ? err.response.data : err;
            console.log("❌ Failed:", { to: inputData.to, error: errorMsg });
        }
    }
    else if (inputData.type === "dynamic_flow") {
        let user = await OrderID.findOne({ from: inputData.to });
        data.type = "interactive";
        data.recipient_type = "individual";
        data.to = inputData.to;

        data.interactive = {
            type: "flow",
            body: {
                text: "ونشكرك على تخصيص دقائق من وقتك لاستيفاء الأسئلة التالية",
            },
            action: {
                name: "flow",
                parameters: {
                    // mode: "draft",
                    mode: "published",
                    flow_message_version: "3",
                    flow_token: "583011828184612",
                    flow_id: "583011828184612",
                    flow_cta: "عرض الأسئلة",
                    flow_action: "navigate",
                    flow_action_payload: {
                        screen: "page_one",
                        data: inputData.payload_data,
                    },
                },
            },
        };



        console.log({ data }, "teeeeeeeeeeeeeeest");
        try {
            const wa_res = await axiosHelper.post(url, data);
            console.log("✅ sent:", {
                to: inputData.to,
                message_id: wa_res.data?.messages?.[0]?.id,
            });
        } catch (err) {
            console.log("❌ failed:", { to: inputData.to, error: err?.response?.data || err });
        }
    }



    return true;
};
