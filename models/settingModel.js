const mongoose = require("mongoose");
const SettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
    },
    value: {
      type: String,
    },
    path: {
      type: String,
    },
    location: {
      type: "object",
      properties: {
        longitude: {
          type: String,
        },
        latitude: {
          type: String,
        },
        name: {
          type: String,
        },
        address: {
          type: String,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Setting", SettingSchema);
