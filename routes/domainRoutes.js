const express = require('express');
const router = express.Router();
const { auth } = require('./middleware/auth');

const domainController = require("../controllers/domainController");



router.route('/').get(domainController.index);
router.route('/').post(domainController.store);
router.route('/:id/enable').put(domainController.enable);
router.route('/:id/disable').put(domainController.disable);



module.exports = router;
