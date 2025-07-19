const WhatsappLog = require('../models/whatsappLogModel');
const WhatsappErrorLog = require('../models/whatsappErrorLogModel');

exports.create = async (data) => {
  const targetData = await WhatsappLog.create({data});
};

exports.createError = async (data) => {
  const targetData = await WhatsappErrorLog.create({data});
};

exports.index = async (req, res) => {
  let response = {
    statusCode: 200,
    status: 'success', 
    message: '',
    data: null,
    count: 0
  }

   const targetData = await WhatsappLog.find({});

  response.data = targetData;


  res.status(response.statusCode).json({
    status: response.status,
    message: response.message,
    data: response.data,
    count: response.data.length
  });
};

exports.indexError = async (req, res) => {
  let response = {
    statusCode: 200,
    status: 'success', 
    message: '',
    data: null,
    count: 0
  }

   const targetData = await WhatsappErrorLog.find({});

  response.data = targetData;


  res.status(response.statusCode).json({
    status: response.status,
    message: response.message,
    data: response.data,
    count: response.data.length
  });
};