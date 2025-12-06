const express = require("express");
const router = express.Router();

const CommentController = require("./fakeComment.controller");

var checkAccessWithKey = require("../../checkAccess");

// router.use(checkAccessWithSecretKey());

//create comment
router.post("/", checkAccessWithKey(), CommentController.store);

//update comment
router.patch("/:commentId", checkAccessWithKey(), CommentController.update);

// get comment list
router.get("/", checkAccessWithKey(), CommentController.get);

router.get("/index", checkAccessWithKey(), CommentController.index);

// delete comment
router.delete("/:commentId", checkAccessWithKey(), CommentController.destroy);

module.exports = router;
