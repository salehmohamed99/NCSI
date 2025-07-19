const mongoose = require("mongoose");

// const autoIncrement = require("@ed3ath/mongoose-auto-increment");

// autoIncrement.initialize(mongoose.connection);

const OrdersSchema = new mongoose.Schema(
  {
    // orderId: { type: Number, required: true, trim: true, unique: true },
    isSessionOpen: { type: Boolean, default: false },
    session_id: { type: String, default: "" },
    paymentUrl: { type: String, default: "" },
    product_items: [
      {
        product_retailer_id: { type: String, required: true },
        quantity: { type: Number, default: 0 },
        item_price: { type: Number, default: 0 },
        currency: { type: String, default: "" },
      },
    ],
    totalPrice: { type: Number, default: 0 },
    catalog_id: { type: String, default: "" },
    isPaid: { type: Boolean, default: false },
    paymentStatus: { type: String, default: "" },
    wa_msg_id: { type: String, required: true, unique: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
  }
);

OrdersSchema.pre("save", async function (next) {
  let sum = 0;

  if (this.isNew) {
    for (let i = 0; i < this.product_items.length; i++) {
      const e = this.product_items[i];
      sum = sum + e.quantity * e.item_price;
    }

    this.totalPrice = sum;
  }

  next();
});

// OrdersSchema.plugin(autoIncrement.plugin, {
//   model: "Orders",
//   field: "orderId",
//   startAt: 1,
// });

module.exports = mongoose.model("Orders", OrdersSchema);
