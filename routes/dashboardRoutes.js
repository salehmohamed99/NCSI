const express = require('express');
const router = express.Router();
const { auth } = require('./middleware/auth');

const dashboardController = require("../controllers/dashboardController");
const webhookLogController = require("../controllers/WebhookLogController");
const whatsappLogController = require("../controllers/whatsappLogController");



router.route('/').get(dashboardController.index);
router.route('/logger').get(webhookLogController.index);
router.route('/failed-logger').get(webhookLogController.indexFailed);

router.route('/whatsapp-logger').get(whatsappLogController.index);
router.route('/whatsapp-error-logger').get(whatsappLogController.indexError);

//usersInsights
router.route('/users-insights').get(dashboardController.usersInsights);
router.route('/remove-users-empty-messages', auth).get(dashboardController.removeUsersWithEmptyMessages);

//removeUsersWithEmptyMessages
router.route('/template-assets/upload').post(dashboardController.uploadTemplateAssets);




module.exports = router;
