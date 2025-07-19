const jwt = require("jsonwebtoken"); 
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const Token = require("../models/tokenModel");

exports.login = async (req, res) => {
  const jwtSecret = process.env.JWT_SECRET;
  let token = null;
  console.log({
    jwtSecret,
  });
  let response = {
    statusCode: 200,
    message: "User successfully Logged in",
    data: [],
  };
  const { username, password } = req.body;

  const user = await User.findOne({ username });

  console.log({ username, password });

  if (user) {
    if (user.isAdmin) {
      const result = await bcrypt.compare(password, user.password);
      if (result) {
        console.log({
          result,
        });
        const maxAge = 3 * 60 * 60;
        token = jwt.sign(
          {
            id: user._id,
            username,
            isAdmin: user.isAdmin,
            role: user.isAdmin ? "admin" : "user",
          },
          jwtSecret,
          {
            expiresIn: maxAge, // 3hrs in sec
          }
        );

        let tokenData = {
          token,
          userId: user._id,
        };

        const target = await Token.findOne({ userId: user._id });
        let tokenRes = null;
        if (target) {
          tokenRes = await Token.findOneAndUpdate({ userId: user._id },{token}, {
            new: true,
            runValidators: true,
          });
        } else {
          tokenRes = await Token.create(tokenData);
        }
        console.log({ tokenRes });
        res.cookie("jwt", token, {
          // httpOnly: true,
          maxAge: maxAge * 1000, // 3hrs in ms
        });

        response = {
          statusCode: 200,
          status: "success",

          data: user,
        };
      } else {
        response = {
          statusCode: 400,
          status: "error",
          message: "invalid credentials",
          data: [],
        };
      }
    } else {
      response = {
        statusCode: 403,
        status: "error",
        message: "you don't have permission to access",
        data: [],
      };
    }
  } else {
    response = {
      statusCode: 400,
      status: "error",
      message: "invalid credentials",
      data: [],
    };
  }

  res.status(response.statusCode).json({
    status: response.status,
    message: response.message,
    data: {
      id: response.data.id,
      name: response.data.name,
      username: response.data.username,
      token,
    },
  });
};

exports.logout = async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = jwt.decode(token);
  
  const {id} = decoded;
  const userRes = await  Token.deleteOne({"userId": id});
  console.log({ decoded,userRes });
  let response = {
    statusCode: 200,
    message: "User successfully Logged out",
  };

  res.status(response.statusCode).json({
    status: response.status,
    message: response.message,
  });
};
