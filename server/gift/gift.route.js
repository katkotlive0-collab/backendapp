const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = require('../../util/multer');

const GiftController = require('./gift.controller');
const upload = multer({
  storage,
});

const checkAccessWithKey = require('../../checkAccess');

// router.use(checkAccessWithKey());

// get all gifts
router.get('/all', checkAccessWithKey(), GiftController.index);

// get category wise gift
router.get(
  '/:categoryId',
  checkAccessWithKey(),
  GiftController.categoryWiseGift
);

//create gift
router.post("/", checkAccessWithKey(), upload.any(), GiftController.store);

//svga Add
router.post("/svgaAdd", checkAccessWithKey(),   upload.fields([{ name: 'image' }, { name: 'svgaImage' }]), GiftController.svgaAdd);

// update gift
router.patch("/:giftId", checkAccessWithKey(), upload.fields([{ name: 'image' }, { name: 'svgaImage' }]), GiftController.update);

// delete image
router.delete('/:giftId', checkAccessWithKey(), GiftController.destroy);

module.exports = router;
