const express = require("express");
const router = express.Router();

const surveyController = require("../controllers/surveyController");



router.route("/").get(surveyController.index).post(surveyController.store);

router
  .route("/:id")
  .get(surveyController.show)
  .patch(surveyController.update)
  .delete(surveyController.delete);

module.exports = router;
