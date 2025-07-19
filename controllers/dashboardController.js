const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Token = require("../models/tokenModel");
const token = process.env.WHATSAPP_TOKEN;
const fs = require("fs");
const axiosHelper = require("../helpers/axiosHelper");
const { getUsers, getAdmin } = require("./userController");
const { getAttchmentType } = require("./messageController");

const DEMO_OMAN_TOKEN = process.env.DEMO_OMAN_TOKEN;

exports.index = async (req, res) => {
  console.log({
    DEMO_OMAN_TOKEN
  })
  const templates = await getTemplates();
  const users = await usersChartData();
  // const admin = await getAdmin();

  console.log({
    templates,
    users
    // admin,
  });

  res.send({ templates, users });
};

exports.uploadTemplateAssets = async (req, res) => {
  let file = req.files["file"];
  let type = await getAttchmentType(file.mimetype);
  const base_url = "https://opaque-battle-mimosa.glitch.me";
  let dataName = file.name.split(".");
  let ext = dataName[dataName.length - 1];

  let fileName = `${type}.${ext}`;

  let path = `attachments/${req.body.template_name}`;

  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
  fs.writeFileSync(`${path}/${fileName}`, file.data);

  console.log({
    existsSync: fs.existsSync(path),
    body: req.body,
    f: req.files.file,
    type,
    ext,
  });
  res.status(200).json({
    path: `${base_url}/${path}/${fileName}`,
  });
};
async function getProductsFromDemoOman() {
  const url = `https://smarterp.top/api/v1.0/products/index?token=${DEMO_OMAN_TOKEN}&company=demo_oman`;
  const data = {
    limit: 1000000000000,
  };

  const result = await axiosHelper.post(url, data);

  console.log({
    result,
  });

  return result.data;
}

exports.usersInsights = async (req, res) => {
  const users = await getUsers();

  const sent = [];
  const notSent = [];
  let response = {};
  response.statusCode = 200;

  // console.log({
  //   users
  // })
  users["whatsapp"].forEach((user) => {
    let { name, phone_number } = user;
    console.log({
      msgs: user.messages,
    });
    if (user.messages.length > 0) {
      sent.push({ name, phone_number });
    } else {
      // let { name, phone_number } = user;
      notSent.push({ name, phone_number });
    }
  });

  // users["whatsapp"].forEach((user) => {
  //   if (user.messages.length === 0) {
  //     let { name, phone_number } = user;
  //     notSent.push({ name, phone_number });
  //   }
  // });

  response.body = {
    reqAt: req.reqTime,
    status: "success",
    results: users.length,
    data: {
      allUsers: users["whatsapp"].length,
      sentCount: sent.length,
      notSentCount: notSent.length,
      sent,
      notSent,
    },
  };
  res.status(response.statusCode).json(response.body);
};
exports.removeUsersWithEmptyMessages = async (req, res) => {
  const users = await getUsers();

  const notSent = [];
  let response = {};
  response.statusCode = 200;
  
  users["whatsapp"].forEach((user) => {
    let { name, phone_number } = user;
    console.log({
      msgs: user.messages,
    });
    if (user.messages.length == 0) {
      notSent.push( phone_number );
    }
  });

  const condition = { phone_number: { $in: notSent } };
  let msg = null;
  User.deleteMany(condition)
    .then((result) => {
      msg = `${result.deletedCount} users deleted successfully.`;
      console.log(`${result.deletedCount} users deleted successfully.`);
    })
    .catch((error) => {
      console.error('Error deleting users:', error);
    });

  response.body = {
    reqAt: req.reqTime,
    status: "success",
    message: msg,
    results: users.length,
    data: {
      allUsers: users["whatsapp"].length,
      notSentCount: notSent.length,
      notSent,
    },
  };
  res.status(response.statusCode).json(response.body);
};
async function getTemplates() {
  const whatsAppID =  process.env.WHATS_APP_ID;
  const templatesUrl = `https://graph.facebook.com/v17.0/${whatsAppID}/message_templates?access_token=${token}`;
  let templatesData = {};
  let count = {
    APPROVED: 0,
    REJECTED: 0,
    PENDING: 0,
  };
  let templatesResult = null;
  try{
   templatesResult = await axiosHelper.get(templatesUrl);
    
  }catch(err){
    console.log({
      err
    });
  }

  templatesResult.data.data.forEach((template) => {
    let { name, category, language } = template;
    if(!name.startsWith("flow_")){
      if (templatesData[template.status]) {
      templatesData[template.status].push({ name: `${name}_${language}`, category, language });
    } else {
      templatesData[template.status] = [{ name: `${name}_${language}`, category, language }];
    }

    count[template.status] += 1;
    }
    
  });

    console.log({
    templatesData,
    count,
  });
  return {
    templatesData,
    count,
  };
}

async function usersChartData() {
  const users = await getUsers("");

  console.log({users})
  
  let count = {
    instagram: {
      all: 0,
      api: 0,
      excel_sheet: 0,
      url: 0,
      conversation: 0,
    },
    whatsapp: {
      all: 0,
      api: 0,
      excel_sheet: 0,
      url: 0,
      conversation: 0
    },
  };
  users["whatsapp"].forEach((user) => {
    console.log('whatsapp', { user , f: count["whatsapp"][user.added_from]});
    if(!count["whatsapp"][user.added_from]) return;
      // count["whatsapp"][user.added_from] = 0;
    count["whatsapp"]["all"] += 1;
    count["whatsapp"][user.added_from] += 1;
  });
  users["instagram"].forEach((user) => {
    console.log('instagram', { user });
    if(!count["instagram"][user.added_from])
      count["instagram"][user.added_from] = 0;
    count["instagram"]["all"] += 1;
    count["instagram"][user.added_from] += 1;
  });

  return count;
}
