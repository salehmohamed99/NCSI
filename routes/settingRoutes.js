const express = require('express');
const router = express.Router();

const settingController = require('../controllers/settingController');

router.route('/').post(settingController.create);
router.route('/attachments').post(settingController.uploadImageTemplate);

router.route('/:key').get(settingController.get);



module.exports = router;
