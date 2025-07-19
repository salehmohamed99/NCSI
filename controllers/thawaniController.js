const Orders = require("../models/ordersModel");
const User = require("../models/userModel");
const axios = require("axios").default;
const axiosHelper = require("../helpers/axiosHelper");
const messageController = require("../controllers/messageController");
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;
const THAWANI_SECRET_KEY = process.env.THAWANI_SECRET_KEY;
const THAWANI_PUBLISHABLE_KEY = process.env.THAWANI_PUBLISHABLE_KEY;




exports.createThawaniSession = async (
  client_reference_id,
  metadata,
  user_phone_number
) => {
  let order = await Orders.findOne({ wa_msg_id: client_reference_id });
  let products = [];
  for (let i = 0; i < order.product_items.length; i++) {
    const e = order.product_items[i];
    products.push({
      name: `Product:${e.product_retailer_id}`,
      quantity: e.quantity,
      unit_amount: e.item_price * 1000,
    });
  }
  const options = {
    method: "POST",
    url: "https://uatcheckout.thawani.om/api/v1/checkout/session",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "thawani-api-key": THAWANI_SECRET_KEY,
    },
    data: {
      client_reference_id: client_reference_id,
      mode: "payment",
      products: products,
      success_url: `https://opaque-battle-mimosa.glitch.me/api/v1/thawani/success?client_reference_id=${client_reference_id}`,
      cancel_url: `https://opaque-battle-mimosa.glitch.me/api/v1/thawani/cancel?client_reference_id=${client_reference_id}`,
      metadata: metadata,
    },
  };

  try {
    const data = await axios.request(options);
    console.log(data, "Reeeeeeeeeeeeeeeeeeeeeeeeeeees");
    const res = data.data;
    if (res.success == true && res.code == 2004) {
      const paymentUrl = `https://uatcheckout.thawani.om/pay/${res.data.session_id}?key=${THAWANI_PUBLISHABLE_KEY}`;
      order.isSessionOpen = true;
      order.session_id = res.data.session_id;
      order.paymentStatus = res.data.payment_status;
      order.paymentUrl = paymentUrl;
      await order.save();
      const adminId = await User.findOne({ platform: "admin" });
      const user = await User.findOne({ _id: order.from });

      const msg = `يرجى الدفع عن طريق بوابة ثواني من خلال الرابط التالي:
      
      ${paymentUrl}`;
      const wellcomeData = {
        from: adminId,
        to: user,
        phone_number: user_phone_number,
        content: msg,
        // parentMsg: wa_msg_id,
        type: "text",
      };
      messageController.sendWellcomeMessage(wellcomeData);
    }
  } catch (error) {
    console.error(error);
  }
};

exports.getSuccessPayment = async (req, res) => {
  let response = {
    statusCode: 200,
    body: null,
  };
  const client_reference_id = req.query.client_reference_id;
  const order = await Orders.findOne({ wa_msg_id: client_reference_id });

  const options = {
    method: "GET",
    url: `https://uatcheckout.thawani.om/api/v1/checkout/reference/${client_reference_id}`,
    headers: {
      Accept: "application/json",
      "thawani-api-key": THAWANI_SECRET_KEY,
    },
  };

  try {
    const data = await axios.request(options);
    console.log(data, " Reeeeeeeeeeeeeeeeeeeeeess");
    const res = data.data;
    if (
      res.success == true &&
      res.code == 2000 &&
      res.data.payment_status == "paid" &&
      order.isPaid == false
    ) {
      const totalPrice = res.data.total_amount;
      // order.totalPrice = totalPrice;
      order.paymentStatus = res.data.payment_status;
      order.isPaid = true;
      await order.save();
      const adminId = await User.findOne({ platform: "admin" });
      const user = await User.findOne({ _id: order.from });
      const wellcomeData = {
        from: adminId,
        to: user,
        phone_number: user.phone_number,
        content: `تم الدفع بنجاح
          لقد قمت بشراء ${res.data.products.length} منتجات بنجاح
          اجمال المبلغ المدفوع ${order.totalPrice} ريال عماني
          نشكرك على تعاملك مع 
          Muscat Apps`,
        parentMsg: order.wa_msg_id,
        type: "text",
      };
      messageController.sendWellcomeMessage(wellcomeData);
      response.body = "تم الدفع بنجاح";
    } else {
      throw new Error("checkout/reference Failed");
    }
  } catch (error) {
    console.error(error);
    response.statusCode = 404;
    response.body = {
      status: "حدث خطأ",
      message: error,
    };
  } finally {
    res.status(response.statusCode).json(response.body);
  }
};

exports.getCancelPayment = async (req, res) => {
  let response = {
    statusCode: 200,
    body: null,
  };
  const client_reference_id = req.query.client_reference_id;
  const order = await Orders.findOne({ wa_msg_id: client_reference_id });

  const options = {
    method: "GET",
    url: `https://uatcheckout.thawani.om/api/v1/checkout/reference/${client_reference_id}`,
    headers: {
      Accept: "application/json",
      "thawani-api-key": THAWANI_SECRET_KEY,
    },
  };

  try {
    const data = await axios.request(options);
    console.log(data, " Reeeeeeeeeeeeeeeeeeeeeess");
    const res = data.data;
    if (
      res.success == true &&
      res.code == 2000 &&
      res.data.payment_status == "unpaid"
    ) {
      //   order.totalPrice = res.data.total_amount;
      //   order.paymentStatus = res.data.payment_status;
      //   order.isPaid = true;
      //   await order.save();
      //   const adminId = await User.findOne({ platform: "admin" });
      //   const user = await User.findOne({ _id: order.from });
      //   const wellcomeData = {
      //     from: adminId,
      //     to: user,
      //     phone_number: user.phone_number,
      //     content: `تم الدفع بنجاح
      //       لقد قمت بشراء ${res.data.products.length} منتجات بنجاح
      //       اجمال المبلغ المدفوع ${totalPrice} ريال عماني
      //       نشكرك على تعاملك مع
      //       Muscat Apps`,
      //     // parentMsg: wa_msg_id,
      //     type: "text",
      //   };
      //   messageController.sendWellcomeMessage(wellcomeData);
      response.body = "تم الغاء عملية الدفع";
    } else {
      throw new Error("checkout/reference Failed");
    }
  } catch (error) {
    console.error(error);
    response.statusCode = 404;
    response.body = {
      status: "حدث خطأ",
      message: error,
    };
  } finally {
    res.status(response.statusCode).json(response.body);
  }
};

// exports.createThawaniSession2 = async (
//     client_reference_id,
//     metadata,
//     user_phone_number
//   ) => {
//     try {
//       const order = await Orders.findOne({ wa_msg_id: client_reference_id });
//       let products = [];
//       for (let i = 0; i < order.product_items.length; i++) {
//         const e = order.product_items[i];
//         products.push({
//           name: `Product:${e.product_retailer_id}`,
//           quantity: e.quantity,
//           unit_amount: e.item_price,
//         });
//       }
//       const url = "https://uatcheckout.thawani.om/api/v1/checkout/session";
//       const data = {
//         client_reference_id: "123",
//         mode: "payment",
//         products: [
//           {
//             name: "product 1",
//             quantity: 1,
//             unit_amount: 100,
//           },
//         ],
//         success_url: `https://opaque-battle-mimosa.glitch.me/api/v1/thawani/success?client_reference_id=${client_reference_id}`,
//         cancel_url: `https://opaque-battle-mimosa.glitch.me/api/v1/thawani/cancel?client_reference_id=${client_reference_id}`,
//         //   metadata: {
//         //     "Customer name": "somename",
//         //     "order id": 0,
//         //   },
//       };

//       const res = await axios({
//         method: "POST",
//         url,
//         headers: {
//           Accept: "application/json",
//           "Content-Type": "application/json",
//           "thawani-api-key": THAWANI_SECRET_KEY,
//         },
//         data,
//       });

//       console.log(res, "Reeeeeeeeeeeeeeeeeeeeeeeeeeees");
//       if (res.success == true && res.code == 2004) {
//         const paymentUrl = `https://uatcheckout.thawani.om/pay/${res.data.session_id}?key=${THAWANI_PUBLISHABLE_KEY}`;
//         order.isSessionOpen = true;
//         order.session_id = res.data.session_id;
//         order.paymentStatus = res.data.payment_status;
//         order.paymentUrl = paymentUrl;
//         await order.save();
//         const adminId = await User.findOne({ platform: "admin" });
//         const user = await User.findOne({ _id: order.from });
//         const wellcomeData = {
//           from: adminId,
//           to: user,
//           phone_number: user_phone_number,
//           content: paymentUrl,
//           // parentMsg: wa_msg_id,
//           type: "text",
//         };
//         messageController.sendWellcomeMessage(wellcomeData);
//       }
//     } catch (e) {
//       console.error(e, "Errrrroooooooor");
//       throw new Error(e);
//     }
//     //   data.client_reference_id = client_reference_id;
//     //   data.mode = "payment";
//     //   data.products = products;
//     //   data.success_url = "https://company.com/success";
//     //   data.cancel_url = "";
//     //   data.metadata = metadata;
//   };
