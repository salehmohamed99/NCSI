const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");

console.log("userRoutes.js");

router.route("/").get(userController.index).post(userController.store);

router.route("/get-admin").get(userController.get_admin);
router.route("/import").post(userController.import);
router.route("/export").get(userController.export);
router.route("/import-url").post(userController.import_url);
router.route("/reset").post(userController.reset);
router.route("/from/:from").get(userController.addedFrom);
router.route("/campaigns/filter").post(userController.addedFromCampaigns);
router.route("/hide/by-data/:from?").post(userController.updateAddedFrom);
router.route("/hide/:from?").get(userController.hideUsers);
router.route("/unhide/:from?").get(userController.unhideUsers);

router.route("/campaigns/:campaign").get(userController.campaigns);
//addedFromCampaigns



router.route("/black-list").get(userController.listBlackListUsers);

router
  .route("/black-list/:id")
  .delete(userController.deleteBlackListUser)

router
  .route("/:id")
  .get(userController.show)
  .patch(userController.update)
  .delete(userController.delete);

module.exports = router;
