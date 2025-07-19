const mongoose = require("mongoose");
// const agenda = require('./jobs/schedule');

// const dotenv = require('dotenv');
const { app, server, ioObject } = require("./app");

// dotenv.config({ path: './.env' });
// mongodb://root:Default%40123@92.205.31.103:27017/?directConnection=true&serverSelectionTimeoutMS=2000&appName=mongosh+2.1.1&authMechanism=DEFAULT
// const DATABASE = process.env.DB_URI;
// console.log({ DATABASE });
const DB = process.env.DB_URI.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

// const DB = process.env.DB_URI;

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log("DB connection successful"));

const PORT = process.env.PORT || 1337;

server.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
