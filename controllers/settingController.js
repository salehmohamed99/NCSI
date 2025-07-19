const Setting = require('../models/settingModel');
const { uploadMediaToWhatsapp } = require("./messageController");

exports.create = async (req, res) => {
  let response = {
    statusCode: 201,
    status: 'success', 
    message: 'wellcomeMessage created successfully',
    data: []
  }

  const {key, value} = req.body;

  const target = await Setting.findOne({key});

  let targetData = [];

  if(target){
    targetData = await Setting.findOneAndUpdate({key}, {value},{
      new: true,
      runValidators: true
    });
  }else{
    targetData = await Setting.create({key,value});
  }

  response.data = targetData;

  res.status(response.statusCode).json({
    status: response.status,
    message: response.message,
    data: response.data,
  });
};

exports.uploadImageTemplate = async (req, res) => {
  // console.log({req: req})

  console.log({ body: req.body });
  const { key, type } = req.body;
  console.log({ key, type });
  const setting = await Setting.findOne({
    key,
  });
  let targetData = [];
  let resData = null;
  if (type !== "LOCATION") {
    let data = {
      file: req.files.file,
      type: req.files.file.mimetype,
      messaging_product: "whatsapp",
    };
    resData = await uploadMediaToWhatsapp(data, key);

    const value = resData.data.id;
    const path = resData.path;

    const setting = await Setting.findOne({
      key,
    });

    if (setting) {
      targetData = await Setting.findOneAndUpdate(
        { key },
        { value, path },
        {
          new: true,
          runValidators: true,
        }
      );
    } else {
      targetData = await Setting.create({ key, value, path });
    }
  } else {
    const location = req.body.location;
    resData = req.body.location;
    if (setting) {
      targetData = await Setting.findOneAndUpdate(
        { key },
        { location },
        {
          new: true,
          runValidators: true,
        }
      );
    } else {
      targetData = await Setting.create({ key, location });
    }
  }

  let response = {
    statusCode: 200,
    status: "success",
    data: resData,
  };

  res.status(response.statusCode).json({
    status: response.status,
    message: "Template Asset uploaded successfully",
    data: response.data,
  });
};

exports.get = async (req, res) => {
  let response = {
    statusCode: 200,
    status: 'success', 
    message: '',
    data: null
  }

  const key = req.params.key;

  const target = await Setting.findOne({key});

  let targetData = [];

  if(target){
    targetData = await Setting.findOne({key});
  response.message = key + ' found';

  }else{
    targetData = []
  response.message = key + ' not found';

  }

  response.data = targetData;


  res.status(response.statusCode).json({
    status: response.status,
    message: response.message,
    data: response.data,
  });
};

