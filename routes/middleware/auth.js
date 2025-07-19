const jwt = require("jsonwebtoken");
const User = require("../../models/userModel");
const Token = require("../../models/tokenModel");

exports.auth = async (req, res, next) => {
  console.log({
    "auth middlewarw": "#############################",
    // req,
    // token: req.headers.authorization.split(" "),
  });

  // const {id, username, }

  const jwtSecret = process.env.JWT_SECRET;
  const token = req.headers.authorization
    ? req.headers.authorization.split(" ")[1]
    : null;
  
  if (token && token !== 'null') {
    
    const decoded = await jwt.decode(token);
  console.log({ token,decoded });

  const { id, username, isAdmin } = decoded;
    jwt.verify(token, jwtSecret, async (err, decodedToken) => {
      console.log({
        decodedToken,
      });
      if (err) {
        return res.status(401).json({ message: "Not authorized" });
      } else {
        if (!decodedToken.isAdmin) {
          return res.status(401).json({ message: "Not authorized" });
        } else {
          const user = await User.findOne({
            _id: decodedToken.id,
            isAdmin: isAdmin,
          });
          const userToken = await Token.findOne({
            userId: user._id,
          });

          const isSameToken = userToken ? userToken.token === token : false;

          console.log({ token, userToken, isSameToken });
          if (user && isSameToken) {
            next();
          } else {
            return res.status(401).json({ message: "Not authorized" });
          }
        }
      }
    });
  } else {
    return res
      .status(401)
      .json({ message: "Not authorized, token not available" });
  }
};
