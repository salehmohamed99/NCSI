const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
    },
    name: {
      type: String,
    },
    password: {
      type: String,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    user_name: {
      type: String,
    },
    platform: {
      type: String,
    },
    phone_number: {
      type: String,
    },
    added_from: {
      type: String,
    },
    messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
  },
  {
    timestamps: true,

    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Define a pre-save hook to clean up and convert phone_number to a number
UserSchema.pre('save', function (next) {
  // Remove non-numeric characters from the phone number string
  const cleanedPhoneNumber = this.phone_number.replace(/\D/g, '');
  // Convert the cleaned phone number to a number type
  this.phone_number = parseInt(cleanedPhoneNumber, 10);
  next();
});

// UserSchema.virtual("messages", {
//   ref: "Message",
//   foreignField: "userId",
//   localField: "_id"
// })

module.exports = mongoose.model("User", UserSchema);
