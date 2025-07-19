const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');


// router.route('/send-message').post(messageController.sendMessage);

router.route("/webhook").post(webhookController.postHandler);

router.route("/webhook").get(webhookController.getHandler);
router.route("/webhook").patch(webhookController.patchHandler);


module.exports = router;
