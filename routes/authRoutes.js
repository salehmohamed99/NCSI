const express = require('express');
const router = express.Router();
const { auth } = require('./middleware/auth');

const authController = require('../controllers/authController');
const userController = require("../controllers/userController");

router.route('/login').post(authController.login);
router.route('/logout',auth).post(authController.logout);


router.route('/register').post(userController.create_admin);

module.exports = router;
