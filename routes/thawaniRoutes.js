const express = require("express");

const router = express.Router();

const thawaniController = require("../controllers/thawaniController");

// عند نجاح عملية الدفع
router.route("/success").get(thawaniController.getSuccessPayment);

// عند الغاء عملية الدفع
router.route("/cancel").get(thawaniController.getSuccessPayment);

module.exports = router;
