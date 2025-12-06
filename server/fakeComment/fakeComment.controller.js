const FakeComment = require('./fakeComment.model');

//create comment
exports.store = async (req, res) => {
  try {
    if (req.body.comment) {
      const commentData = {
        comment: req.body.comment.trim(),
      };
      const comment = await new FakeComment(commentData);
      await comment.save(async (error, comment) => {
        if (error) {
          return res
            .status(200)
            .json({ status: false, error: error.message || 'Server Error!' });
        } else {
          return res.status(200).json({
            status: true,
            message: 'Comment Create Successful',
            comment,
          });
        }
      });
    } else {
      return res.status(200).json({
        status: false,
        message: 'Invalid Details !',
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || 'Internal Server Error !',
    });
  }
};

//get comment [android]
exports.get = async (req, res) => {
  try {
    const comments = await FakeComment.aggregate([
      { $match: { _id: { $ne: null } } },
      {
        $lookup: {
          from: 'users',
          as: 'user',
          pipeline: [
            {
              $sample: {
                size: 1,
              },
            },
            {
              $lookup: {
                from: 'levels',
                localField: 'level',
                foreignField: '_id',
                as: 'level',
              },
            },
            {
              $unwind: {
                path: '$level',
              },
            },
          ],
        },
      },
      {
        $unwind: {
          path: '$user',
        },
      },
      {
        $sort: { createdAt: -1 },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: ' Successful',
      comment: comments,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || 'Internal Server Error !',
    });
  }
};

// get comment for [admin penal]
exports.index = async (req, res) => {
  try {
    const comment = await FakeComment.find();

    return res.status(200).json({
      status: true,
      message: ' Successful',
      comment: comment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || 'Internal Server Error !',
    });
  }
};

// update comment
exports.update = async (req, res) => {
  try {
    const comment = await FakeComment.findById(req.params.commentId);

    if (!comment) {
      return res
        .status(200)
        .json({ status: false, message: 'Comment does not Exist!' });
    }

    comment.comment = req.body.comment;
    comment.save();

    return res.status(200).json({
      status: true,
      message: ' Successful',
      comment: comment,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || 'Internal Server Error !',
    });
  }
};
// delete comment
exports.destroy = async (req, res) => {
  try {
    const comment = await FakeComment.findById(req.params.commentId);

    if (!comment) {
      return res
        .status(200)
        .json({ status: false, message: 'Comment does not Exist!' });
    }

    comment.deleteOne();

    return res.status(200).json({
      status: true,
      message: ' Successful',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      error: error.message || 'Internal Server Error !',
    });
  }
};
