const express = require('express');
const router = express.Router();
const multer = require('multer');
const storage = require('../../util/multer');

const VideoController = require('./video.controller');
const upload = multer({
  storage,
});

const checkAccessWithKey = require('../../checkAccess');

// router.use(checkAccessWithKey());

// get all post [frontend]
router.get('/getVideo', checkAccessWithKey(), VideoController.index);

// get user wise video list
router.get('/getRelite', checkAccessWithKey(), VideoController.getVideo);

// get video by id
router.get(
  '/getReliteById',
  checkAccessWithKey(),
  VideoController.getVideoById
);

//create video
router.post(
  '/uploadRelite',
  checkAccessWithKey(),
  upload.fields([
    { name: 'video' },
    { name: 'screenshot' },
    { name: 'thumbnail' },
  ]),
  VideoController.uploadVideo
);
//create Fake video
router.post(
  '/uploadFakeRelite',
  checkAccessWithKey(),
  upload.fields([
    { name: 'video' },
    { name: 'screenshot' },
    { name: 'thumbnail' },
  ]),
  VideoController.uploadFakeVideo
);

//update Fake video
router.patch(
  '/updateFakeRelite',
  checkAccessWithKey(),
  upload.fields([
    { name: 'video' },
    { name: 'screenshot' },
    { name: 'thumbnail' },
  ]),
  VideoController.updateFakeVideo
);

// allow disallow comment on relite
router.patch(
  '/relite/commentSwitch/:videoId',
  checkAccessWithKey(),
  VideoController.allowDisallowComment
);

// delete video
router.delete('/deleteRelite', checkAccessWithKey(), VideoController.destroy);

//test trail
router.get(
  '/getReliteBySong',
  checkAccessWithKey(),
  VideoController.getReliteBySong
);


//get video by Id [ adminPanel ]
router.get(
  "/videoDetail",
  checkAccessWithKey(),
  VideoController.videoDetail
);
module.exports = router;
