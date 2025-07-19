const User = require("../models/userModel");
const Message = require("../models/messageModel");
const axios = require("axios").default;
const axiosHelper = require("../helpers/axiosHelper");
const bcrypt = require("bcryptjs");
const BlackList = require("../models/blackListModel");
const schedule = require("../jobs/scheduleJobs");
const ExcelJS = require('exceljs');

exports.index = async (req, res) => {
  let response = {
    statusCode: 200,
    body: null,
  };

  try {
    // const whatsappPlatform = await User.find({ platform: 'whatsapp'}).populate({path: 'messages',  model: Message, options: { sort: [{"createdAt": -1}],limit: 1}}).exec();
    const page = parseInt(req.query.page) || 1; // Current page, default to 1
    const limit = parseInt(req.query.limit) || 10; // Number of items per page, default to 10
    const search = req.query.search || "";

    console.log({ search });

    const {users, totalCount, totalPages} = await this.getUsersWithPagination(page, limit, search);
    // const users = await this.getUsers(search);
    response.statusCode = 200;
    response.body = {
      reqAt: req.reqTime,
      status: "success",
      results: users.length,
      data: {
        users,
        // totalCount,
        // totalPages
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

// exports.getUsers = async () => {
//   const whatsappPlatform = await User.aggregate([
//       {
//         $match: {
//           platform: "whatsapp",
//         },
//       },
//       {
//         $lookup: {
//           from: "messages", //must be collection name for posts
//           localField: "_id",
//           foreignField: "from",

//           as: "messages",
//         },
//       },
//       {
//         $lookup: {
//           from: "messages", //must be collection name for posts
//           localField: "_id",

//           foreignField: "to",

//           as: "messages_",
//         },
//       },
//     ]);
//     // whatsappPlatform = whatsappPlatform.map(user => user
//     // const instagramPlatform = await User.find({ platform: 'instagram'}).populate({path: 'messages',options: { sort: [{"createdAt": -1}],limit: 1}}).exec();

//     const instagramPlatform = await User.aggregate([
//       {
//         $match: {
//           platform: "instagram",
//         },
//       },
//       {
//         $lookup: {
//           from: "messages", //must be collection name for posts
//           localField: "_id",
//           foreignField: "from",

//           as: "messages",
//         },
//       },
//       {
//         $lookup: {
//           from: "messages", //must be collection name for posts
//           localField: "_id",

//           foreignField: "to",

//           as: "messages_",
//         },
//       },
//     ]);

//     const users = {
//       whatsapp: whatsappPlatform.map((item) => {
//         return {
//           id: item._id,
//           name: item.name,
//           phone_number: item.phone_number,
//           added_from: item.added_from,
//           messages: item.messages.concat(item.messages_).sort(sortObj)[0]
//             ? [item.messages.concat(item.messages_).sort(sortObj)[0]]
//             : [],
//         };
//       }),
//       instagram: instagramPlatform.map((item) => {
//         return {
//           id: item._id,
//           name: item.name,
//           phone_number: item.phone_number,
//           messages: item.messages.concat(item.messages_).sort(sortObj)[0]
//             ? [item.messages.concat(item.messages_).sort(sortObj)[0]]
//             : [],
//         };
//       }),
//     };
//   return users;
// }

exports.getUsers = async (search) => {
  console.log({ search });
  let matchStage = {};
  if (search == "") {
    matchStage = {
      platform: "whatsapp",
    };
  } else {
    matchStage = {
      platform: "whatsapp",
      $or: [
        { name: { $regex: search, $options: "i" } }, // Case-insensitive search on name
        { phone_number: { $regex: search, $options: "i" } }, // Case-insensitive search on phone_number
      ],
    };
  }

  const whatsappPlatform = await User.aggregate([
    { $match: matchStage },
    {
      $lookup: {
        from: "messages", //must be collection name for posts
        localField: "_id",
        foreignField: "from",

        as: "messages",
      },
    },
    {
      $lookup: {
        from: "messages", //must be collection name for posts
        localField: "_id",

        foreignField: "to",

        as: "messages_",
      },
    },
  ]);
  // whatsappPlatform = whatsappPlatform.map(user => user
  // const instagramPlatform = await User.find({ platform: 'instagram'}).populate({path: 'messages',options: { sort: [{"createdAt": -1}],limit: 1}}).exec();

  const instagramPlatform = await User.aggregate([
    {
      $match: {
        platform: "instagram",
        $or: [
          { name: { $regex: search, $options: "i" } }, // Case-insensitive search on name
          { phone_number: { $regex: search, $options: "i" } }, // Case-insensitive search on phone_number
        ],
      },
    },
    {
      $lookup: {
        from: "messages", //must be collection name for posts
        localField: "_id",
        foreignField: "from",

        as: "messages",
      },
    },
    {
      $lookup: {
        from: "messages", //must be collection name for posts
        localField: "_id",

        foreignField: "to",

        as: "messages_",
      },
    },
  ]);

  const users = {
    whatsapp: whatsappPlatform.map((item) => {
      return {
        id: item._id,
        name: item.name,
        phone_number: item.phone_number,
        added_from: item.added_from,
        messages: item.messages.concat(item.messages_).sort(sortObj)[0]
          ? [item.messages.concat(item.messages_).sort(sortObj)[0]]
          : [],
      };
    }),
    instagram: instagramPlatform.map((item) => {
      return {
        id: item._id,
        name: item.name,
        phone_number: item.phone_number,
        messages: item.messages.concat(item.messages_).sort(sortObj)[0]
          ? [item.messages.concat(item.messages_).sort(sortObj)[0]]
          : [],
      };
    }),
  };
  return users;
};

exports.getUsersWithNoPagination = async (search = "") => {
  let matchStage = {};
  if (search == "") {
    matchStage = {
      platform: "whatsapp",
    };
  } else {
    matchStage = {
      platform: "whatsapp",
      $or: [
        { name: { $regex: search, $options: "i" } }, // Case-insensitive search on name
        { phone_number: { $regex: search, $options: "i" } }, // Case-insensitive search on phone_number
      ],
    };
  }

  console.log({
    sssss: search,
    skip,
    matchStage,
  });

  try {
    // Define the aggregation pipeline for whatsapp platform
    const whatsappPipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "from",
          as: "messages",
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "to",
          as: "messages_",
        },
      },
    ];

    // Define the aggregation pipeline for instagram platform
    const instagramPipeline = [
      {
        $match: {
          platform: "instagram",
          $or: [
            { name: { $regex: search, $options: "i" } }, // Case-insensitive search on name
            { phone_number: { $regex: search, $options: "i" } }, // Case-insensitive search on phone_number
          ],
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "from",
          as: "messages",
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "to",
          as: "messages_",
        },
      },
    ];

    // Execute the aggregation pipelines with pagination
    const [whatsappPlatform, instagramPlatform] = await Promise.all([
      User.aggregate(whatsappPipeline),
      User.aggregate(instagramPipeline),
    ]);

    console.log({
      whatsappPlatform,
    });

    // Map the results and format them as needed
    const users = {
      whatsapp: whatsappPlatform.map((item) => {
        return {
          id: item._id,
          name: item.name,
          phone_number: item.phone_number,
          added_from: item.added_from,
          messages: item.messages.concat(item.messages_).sort(sortObj)[0]
            ? [item.messages.concat(item.messages_).sort(sortObj)[0]]
            : [],
        };
      }),
      instagram: instagramPlatform.map((item) => {
        return {
          id: item._id,
          name: item.name,
          phone_number: item.phone_number,
          messages: item.messages.concat(item.messages_).sort(sortObj)[0]
            ? [item.messages.concat(item.messages_).sort(sortObj)[0]]
            : [],
        };
      }),
    };

    return { users };
  } catch (error) {
    throw new Error("Error fetching users with pagination");
  }
};

exports.getUsersWithPagination = async (page = 1, limit = 10, search = "") => {
  const skip = (page - 1) * limit; // Calculate the number of documents to skip

  let matchStage = {};
  if (search == "") {
    matchStage = {
      platform: "whatsapp",
    };
  } else {
    matchStage = {
      platform: "whatsapp",
      $or: [
        { name: { $regex: search, $options: "i" } }, // Case-insensitive search on name
        { phone_number: { $regex: search, $options: "i" } }, // Case-insensitive search on phone_number
      ],
    };
  }

  console.log({
    sssss: search,
    skip,
    matchStage,
  });

  try {
    // Query to get total count of documents in the collection
    const totalCount = await User.countDocuments(matchStage);

    // Calculate total pages based on the pagination limit
    const totalPages = Math.ceil(totalCount / limit);

    // Define the aggregation pipeline for whatsapp platform
    const whatsappPipeline = [
      { $match: matchStage },
      {
        $skip: skip, // Skip documents based on pagination
      },
      {
        $limit: limit, // Limit the number of documents per page
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "from",
          as: "messages",
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "to",
          as: "messages_",
        },
      },
      
    ];

    // Define the aggregation pipeline for instagram platform
    const instagramPipeline = [
      {
        $match: {
          platform: "instagram",
          $or: [
            { name: { $regex: search, $options: "i" } }, // Case-insensitive search on name
            { phone_number: { $regex: search, $options: "i" } }, // Case-insensitive search on phone_number
          ],
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "from",
          as: "messages",
        },
      },
      {
        $lookup: {
          from: "messages",
          localField: "_id",
          foreignField: "to",
          as: "messages_",
        },
      },
      {
        $skip: skip, // Skip documents based on pagination
      },
      {
        $limit: limit, // Limit the number of documents per page
      },
    ];

    // Execute the aggregation pipelines with pagination
    const [whatsappPlatform, instagramPlatform] = await Promise.all([
      User.aggregate(whatsappPipeline),
      User.aggregate(instagramPipeline),
    ]);

    console.log({
      whatsappPlatform,
    });

    // Map the results and format them as needed
    const users = {
      whatsapp: whatsappPlatform.map((item) => {
        return {
          id: item._id,
          name: item.name,
          phone_number: item.phone_number,
          added_from: item.added_from,
          messages: item.messages.concat(item.messages_).sort(sortObj)[0]
            ? [item.messages.concat(item.messages_).sort(sortObj)[0]]
            : [],
        };
      }),
      instagram: instagramPlatform.map((item) => {
        return {
          id: item._id,
          name: item.name,
          phone_number: item.phone_number,
          messages: item.messages.concat(item.messages_).sort(sortObj)[0]
            ? [item.messages.concat(item.messages_).sort(sortObj)[0]]
            : [],
        };
      }),
    };

    return { users, totalCount, totalPages };
  } catch (error) {
    throw new Error("Error fetching users with pagination");
  }
};

exports.create_admin = async (req, res) => {
  const {
    name,
    platform,
    phone_number,
    username,
    password,
    super_admin_key,
    added_from,
  } = req.body;

  let response = {
    statusCode: 200,
    status: "success",
    message: "",
    data: [],
  };
  if (super_admin_key === process.env.SUPER_ADMIN_KEY) {
    console.log({
      name,
      platform,
      pass: await bcrypt.hash(password, 10),
      phone_number,
      username,
      password,
      super_admin_key,
    });
    const isAdmin = await User.findOne({ isAdmin: true });

    if (isAdmin) {
      response.message = "user is exist";
    } else {
      const user = await User.create({
        name,
        platform,
        password: await bcrypt.hash(password, 10),
        phone_number,
        username,
        isAdmin: true,
        added_from,
      });
      response.data = {
        name: user.name,
        username: user.username,
      };
    }
  } else {
    response = {
      statusCode: 403,
      status: "error",
      message: "",
      data: [],
    };
  }

  res.status(response.statusCode).json({
    status: response.status,
    data: response.data,
  });
};

exports.get_admin = async (req, res) => {
  const data = await this.getAdmin();
  let response = {
    statusCode: 200,
    status: "success",
    data,
  };
  res.status(response.statusCode).json({
    status: response.status,
    data: response.data,
  });
};

exports.getAdmin = async () => {
  const user = await User.find({ platform: "admin" });
  const data = user.map((item) => {
    return {
      id: item._id,
      name: item.name,
      phone_number: item.phone_number,
    };
  });

  return data;
};

exports.show = async (req, res) => {
  const admin = await User.findOne({ platform: "admin" });
  const message = await Message.updateMany(
    { from: req.params.id, to: admin._id },
    { seen: true },
    {
      new: true,
      runValidators: true,
    }
  );

  let { page, limit } = req.query;

  limit = limit ? limit : 10;
  page = page ? (page - 1) * limit : 0;

  const user = await User.find({ _id: req.params.id }).populate({
    path: "messages",
    options: {
      sort: { createdAt: -1 },
      skip: page,
      limit,
    },
    populate: {
      path: "parent",
      model: "Message",
    },
  });

  let response = {
    statusCode: 200,
    status: "success",
    data: user.map((item) => {
      return {
        id: item._id,
        name: item.name,
        phone_number: item.phone_number,
        messages: item.messages,
      };
    }),
  };
  res.status(response.statusCode).json({
    status: response.status,
    data: response.data,
  });
};

exports.store = async (req, res) => {
  try {
    console.log({ body: req.body });
    const newItem = await User.create(req.body);
    res.status(201).json({
      status: "success",

      data: {
        message: newItem,
      },
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.update = async (req, res) => {
  let response = {
    statusCode: 200,
    body: null,
  };

  try {
    const userUdated = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    const user = await User.find({ _id: req.params.id }).populate("messages");

    let data = user.map((item) => {
      return {
        id: item._id,
        name: item.name,
      };
    });
    response.body = {
      status: "success",
      data,
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

exports.delete = (req, res) => {
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

exports.reset = async (req, res) => {
  let response = {
    statusCode: 200,
    status: "success",
    data: "reset",
  };

  const { added_from } = req.body;
  let responseData = null;
  if (added_from) {
    //  responseData = await User.deleteMany({ added_from });
    let usersToRemove = [];
    if (added_from === "all") {
      usersToRemove = await User.find({ isAdmin: false });
      responseData = await User.deleteMany({ isAdmin: false });
    } else {
      usersToRemove = await User.find({ added_from });
      responseData = await User.deleteMany({ added_from });
    }
    const messageIdsToRemove = usersToRemove.flatMap((user) => user.messages);
    await Message.deleteMany({ _id: { $in: messageIdsToRemove } });
    response.data = `${added_from} users reset successfully`;
  } else {
    response.statusCode = 400;
    (response.status = "failed"),
      (response.data = "Please add added from variable");
  }
  console.log({
    added_from,
    // responseData
  });

  res.status(response.statusCode).json({
    status: response.status,
    data: response.data,
  });
};

exports.import = async (req, res) => {
  try {
    const { data } = req.body;

    let response = [];

    console.log({ data });
    // data.forEach(async (item) => {
    response = await insertUsers(data, "excel_sheet");

    //
    // })

    res.status(201).json({
      status: "success",

      data: response,
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.import_url = async (req, res) => {
  try {
    const { url } = req.body;

    let response = [];

    const dataInput = {
      limit: 1000000000000,
    };

    const resData = await axiosHelper.post(url, dataInput);

    // console.log({d: resData['data']['data']})

    // const resData = await axiosHelper.get(url);
    let filteredDta = [];

    let data = resData["data"]["data"];
    schedule.importURL(data);
    //     data.forEach(async (item) => {
    //       if (
    //         item.name &&
    //         item.mobile &&
    //         item.name != "null" &&
    //         item.mobile != "null"
    //       ) {
    //         filteredDta.push([item.name, item.mobile]);
    //       }
    //     });

    //     console.log(filteredDta);

    //     response = await insertUsers(filteredDta, 'url');

    //
    // })

    res.status(201).json({
      status: "success",
      messages: ["users imported in backend"],
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.export = async (req, res) => {
  const { addedFrom } = req.query;

  let filter = {isAdmin: 0};
  if (addedFrom != 'all'){
    filter.added_from = addedFrom;
  }
  
  console.log({
    added_from: filter.added_from
  });

  const users = await User.find(filter); // or knex/db query if not using Mongoose

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users');

  worksheet.columns = [
    { header: 'Name', key: 'name', width: 30 },
    { header: 'Phone Number', key: 'phone_number', width: 30 },
    { header: 'Added From', key: 'added_from', width: 20 },
    { header: 'Created At', key: 'createdAt', width: 25 }
  ];

  users.forEach(user => {
    worksheet.addRow({
      name: user.name || user.username || user.user_name,
      phone_number: user.phone_number,
      added_from: user.added_from,
      createdAt: user.createdAt
    });
  });

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=users.xlsx');

  await workbook.xlsx.write(res);
  res.end();
};

async function insertUsers(data, addedFrom) {
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
    console.log({ data: data[idx][0] });

    if (data[idx][0] && data[idx][0] !== undefined) {
      preparedData = {
        name: data[idx][0],
        user_name: data[idx][0],
        phone_number: data[idx][1],
        platform: "whatsapp",
        isAdmin: false,
        added_from: addedFrom,
      };
      console.log({ preparedData });

      const isExist = await User.findOne({
        phone_number: data[idx][1],
        platform: "whatsapp",
      });

      console.log({
        isExist,
      });

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

  return response;
}

function sortObj(a, b) {
  if (a.createdAt > b.createdAt) {
    return -1;
  }
  if (a.createdAt < b.createdAt) {
    return 1;
  }
  return 0;
}

exports.listBlackListUsers = async (req, res) => {
  try {
    let { page, limit } = req.query;
    limit = limit ? +limit : 10;
    // page = page ? (+page - 1) * limit : 0;
    const skip = (+page - 1) * limit;

    let response = [];
    const list = await BlackList.find().limit(limit).skip(skip);

    const total_documents = await BlackList.countDocuments();

    const previous_pages = page - 1;
    const next_pages = Math.ceil(total_documents / limit);

    console.log({ page, limit });

    res.status(200).json({
      status: "success",
      page: +page,
      size: limit,
      data: list,
      previous: previous_pages,
      next: next_pages,
    });
  } catch (err) {
    console.log({ err });
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};
exports.addedFrom = async (req, res) => {
  try {
    let { from } = req.params;
    let users = [];

    let response = [];
    if (from == "all") users = await User.find();
    else
      users = await User.find({
        added_from: from,
      });

    let data = users.map((item) => {
      return {
        id: item._id,
        name: item.name,
      };
    });

    console.log({
      from,
      data,
    });

    res.status(200).json({
      status: "success",
      data,
    });
  } catch (err) {
    console.log({ err });
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.addedFromCampaigns = async (req, res) => {
  try {
    console.log({ body: req.body });
    let campaigns = req.body;
    let users = [];

    //     let response = [];
    users = await User.find({ added_from: { $in: campaigns } });

    let data = users.map((item) => {
      return {
        id: item._id,
        name: item.name,
      };
    });

    console.log({
      campaigns,
      data,
    });

    res.status(200).json({
      status: "success",
      data,
      // data
    });
  } catch (err) {
    console.log({ err });
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.campaigns = async (req, res) => {
  try {
    let { campaign } = req.params;
    let url = "";
    let response = [];

    switch (campaign) {
      case "30-days-without-orders":
        url = "https://pos.delipizza.online/contacts/without-transactions";
        break;
    }

    const users = await User.find({ added_from: campaign });

    if (users.length > 0) {
      await User.deleteMany({ added_from: campaign });
      console.log(`${users.length} user(s) deleted.`);
    }

    const resData = await axiosHelper.get(url);
    let data = {
      data: resData["data"],
      campaign,
    };
    console.log({
      // data,
      count: resData["data"].length
    });
    schedule.campaigns(data);

    res.status(200).json({
      status: "success",
      messages: ["importing users in backend"],
      usersCount: resData["data"].length,
    });
  } catch (err) {
    console.log({ err });
    res.status(400).json({
      status: "fail",
      message: err,
    });
  }
};

exports.deleteBlackListUser = async (req, res) => {
  try {
    let { id } = req.params;

    const list = await BlackList.deleteOne({ _id: id });

    console.log({
      id,
      list,
    });

    res.status(200).json({
      success: true,
      status: "success",
      message: "Phone number removed from black list",
    });
  } catch (err) {
    console.log({ err });
    res.status(400).json({
      success: false,
      status: "fail",
      message: err,
    });
  }
};

exports.hideUsers = async (req, res) => {
  console.log("hideUsers");

  const added_from = req.params.from || "excel_sheet";

  const added_from_validation_array = [
    "api",
    "excel_sheet",
    "url",
    "conversation",
  ];

  if (added_from_validation_array.includes(added_from)) {
    try {
      // Find users with add_from equal to "excle"
      const users = await User.find({
        added_from,
        messages: { $exists: true, $ne: [] },
      });

      // Update the add_from field to "excle_copy" for each user
      const updatePromises = users.map(async (user) => {
        user.added_from = `${added_from}_copy`;
        return user.save();
      });

      // Wait for all updates to complete
      const updatedUsers = await Promise.all(updatePromises);

      console.log(`${added_from}_copy`);
      res
        .status(200)
        .json({ message: `${users.length} users updated successfully.` });
    } catch (error) {
      console.error("Error updating users:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(422).json({ error: "Invalid params" });
  }
};
exports.unhideUsers = async (req, res) => {
  console.log("unhideUsers");

  const added_from = req.params.from || "excel_sheet";

  const added_from_validation_array = [
    "api",
    "excel_sheet",
    "url",
    "conversation",
  ];

  if (added_from_validation_array.includes(added_from)) {
    try {
      // Find users with add_from equal to "added_from_copy"
      const users = await User.find({
        added_from: `${added_from}_copy`,
        // messages: { $exists: true, $ne: [] },
      });

      // Update the add_from field to original "added_from" for each user
      const updatePromises = users.map(async (user) => {
        user.added_from = added_from;
        return user.save();
      });

      // Wait for all updates to complete
      const updatedUsers = await Promise.all(updatePromises);

      console.log(`${added_from} restored`);
      res
        .status(200)
        .json({ message: `${users.length} users restored successfully.` });
    } catch (error) {
      console.error("Error restoring users:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(422).json({ error: "Invalid params" });
  }
};

exports.updateAddedFrom = async (req, res) => {
  console.log("updateAddedFrom");

  const usersData = req.body.users;
  const added_from = req.params.from || "excel_sheet";

  const added_from_validation_array = [
    "api",
    "excel_sheet",
    "url",
    "conversation",
  ];
  
  console.log({
    usersData,
    added_from
  })
  // res.status(200).json({ message: "ok" });

  if (added_from_validation_array.includes(added_from)) {

    if (!Array.isArray(usersData) || usersData.length === 0) {
      return res.status(400).json({ error: "Invalid user data" });
    }

    try {
      // Update the add_from field to "excel_sheet_copy" for each user
      const updatePromises = usersData.map(async (user) => {
        // Find the user by id and update the added_from field
        const updatedUser = await User.findByIdAndUpdate(
          user.id,
          { added_from: `${added_from}_copy` },
          { new: true }
        );
        return updatedUser;
      });

      // Wait for all updates to complete
      const updatedUsers = await Promise.all(updatePromises);

      res
        .status(200)
        .json({ message: `${updatedUsers.length} users updated successfully.` });
    } catch (error) {
      console.error("Error updating users:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    res.status(422).json({ error: "Invalid params" });
  }
};
