const axios = require("axios").default;

exports.post = async (url, data) => {
  console.log('test axios post');
  return await axios({
    method: "POST",
    url,
    data,
    headers: { "Content-Type": "application/json" },
  });
};

exports.get = async (url) => {
  return await axios({
    method: "GET",
    url,
    headers: { "Content-Type": "application/json" },
  });
};
