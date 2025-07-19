const express = require('express');

const router = express.Router();
   

const messageController = require('../controllers/messageController');

// router.param('id', tourController.checkID);
router
  .route('/')
  .get(messageController.getAllMessages)
  .post(messageController.createMessage);

router
  .route('/get-image')
  .post(messageController.getImage);

  router
  .route('/attachment')
   
  .post(messageController.attachmentMessage );

//upload-image-template
 router
  .route('/upload-image-template')
   
  .post(messageController.uploadImageTemplate );

 router
  .route('/get-template-status')
   
  .post(messageController.getTemplateStatus );

router
  .route('/:id')
  .get(messageController.getMessage)
  .patch(messageController.updateMessage)
  .delete(messageController.deleteMessage);

module.exports = router;
