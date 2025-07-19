const { json } = require("body-parser");
const mongoose = require("mongoose");
const OrderIDSchema = new mongoose.Schema(
    {
        from: { type: String, default: "" },
        questionsArray: { type: Array, default: [], },
        payload_data: { type: Object, default: {}, }

    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("OrderID", OrderIDSchema);
