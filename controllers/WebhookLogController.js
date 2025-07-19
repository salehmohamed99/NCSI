const WebhookLog = require('../models/webhookLogModel');
const WebhookFailedLog = require('../models/webhookFailedLogModel');
exports.create = async (data) => {
  const targetData = await WebhookLog.create({data});
};

exports.createWebhookFailedLog  = async (data) => {
  const targetData = await WebhookFailedLog.create({data});
};

exports.index = async (req, res) => {
  let response = {
    statusCode: 200,
    status: 'success', 
    message: '',
    data: null
  }

   const targetData = await WebhookLog.find({});

  response.data = targetData;


  res.status(response.statusCode).json({
    status: response.status,
    message: response.message,
    data: response.data,
  });
};

exports.indexFailed = async (req, res) => {
  let response = {
    statusCode: 200,
    status: 'success', 
    message: '',
    data: null
  }

   const targetData = await WebhookFailedLog.find({});

  response.data = targetData;


  res.status(response.statusCode).json({
    status: response.status,
    message: response.message,
    data: response.data,
  });
};