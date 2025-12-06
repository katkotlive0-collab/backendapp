const Video = require("./video.model");
const User = require("../user/user.model");
const Hashtag = require("../hashtag/hashtag.model");
const Song = require("../song/song.model");
const Favorite = require("../favorite/favorite.model");
const Comment = require("../comment/comment.model");
const fs = require("fs");
const mongoose = require("mongoose");

var FCM = require("fcm-node");
var config = require("../../config");
var fcm = new FCM(config.SERVER_KEY);
const { deleteFile } = require("../../util/deleteFile");
const Setting = require("../setting/setting.model");

//delete files function
const deleteFiles = (data) => {
  if (data.video) deleteFile(data.video[0]);
  if (data.screenshot) deleteFile(data.screenshot[0]);
  if (data.thumbnail) deleteFile(data.thumbnail[0]);
};

// index
exports.index = async (req, res) => {
  try {
    if (req.query.userId) {
      const user = await User.findById(req.query.userId);
      if (!user) return res.status(200).json({ status: false, message: "User does not found!" });
      const video = await Video.aggregate([
        {
          $match: { userId: user._id },
        },
        {
          $lookup: {
            from: "comments",
            localField: "_id",
            foreignField: "video",
            as: "comment",
          },
        },
        {
          $addFields: {
            comment: { $size: "$comment" },
          },
        },
      ]);
      return res.status(200).json({ status: true, message: "Success!!", video });
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    let dateFilterQuery = {};
    if (req.query.startDate !== "ALL" && req.query.endDate !== "ALL") {
      dateFilterQuery = {
        analyticDate: { $gte: req.query.startDate, $lte: req.query.endDate },
      };
    }
    console.log("......................");

    let query;
    if (req.query.type === "Fake") {
      query = {
        isFake: true,
      };
    } else {
      query = {
        isFake: false,
      };
    }

    const video = await Video.aggregate([
      {
        $match: { isDelete: false, ...query },
      },
      {
        $addFields: {
          analyticDate: { $arrayElemAt: [{ $split: ["$date", ", "] }, 0] },
        },
      },
      {
        $match: dateFilterQuery,
      },
      {
        $sort: { _id: -1 },
      },
      {
        $lookup: {
          from: "users",
          let: { userId: "$userId" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$$userId", "$_id"] } },
            },
            // {
            //   $project: {
            //     name: 1,
            //     username: 1,
            //     image: 1,
            //   },
            // },
          ],
          as: "userId",
        },
      },
      {
        $unwind: {
          path: "$userId",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "video",
          as: "comment",
        },
      },
      {
        $addFields: {
          comment: { $size: "$comment" },
        },
      },
      {
        $lookup: {
          from: "songs",
          let: { songId: "$song" },
          pipeline: [
            {
              $match: { $expr: { $eq: ["$$songId", "$_id"] } },
            },
            {
              $project: {
                song: 1,
              },
            },
          ],
          as: "song",
        },
      },
      {
        $unwind: {
          path: "$song",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $facet: {
          video: [
            { $skip: (start - 1) * limit }, // how many records you want to skip
            { $limit: limit },
          ],
          pageInfo: [
            { $group: { _id: null, totalRecord: { $sum: 1 } } }, // get total records count
          ],
        },
      },
    ]);
    return res.status(200).json({
      status: true,
      message: "Success!!",
      total: video[0].pageInfo.length > 0 ? video[0].pageInfo[0].totalRecord : 0,
      video: video[0].video,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};

// create video
exports.uploadVideo = async (req, res) => {
  try {
    if (!req.files.video || !req.body.userId || !req.files.screenshot) {
      deleteFiles(req?.files);
      return res.status(200).json({ status: false, message: "Invalid Details!" });
    }

    const user = await User.findById(req.body.userId);
    if (!user) {
      deleteFiles(req?.files);
      return res.status(200).json({ status: false, message: "User does not found!" });
    }

    let song;
    if (req.body.songId) {
      song = await Song.findById(req.body.songId);
      if (!song) {
        deleteFiles(req?.files);
        return res.status(200).json({ status: false, message: "Song does not found!" });
      }
    }

    var removeComa = req.body.hashtag.replace(/,\s*$/, "");

    var hashtagList = removeComa.split(",");

    if (hashtagList.length > 0) {
      hashtagList.map((hashtag) => {
        const h = hashtag.toLowerCase();
        if (h !== "" || h !== " ") {
          Hashtag.findOneAndUpdate({ hashtag: h }, {}, { upsert: true }, function (err) {
            // console.log(err)
          });
        }
      });
    }

    const video = new Video();

    video.userId = user._id;
    video.video = config.baseURL + req.files.video[0].path;
    video.hashtag = hashtagList;
    video.location = req.body.location;
    video.caption = req.body.caption;

    const mentions = Array.isArray(req.body.mentionPeople) ? req.body.mentionPeople : [req.body.mentionPeople];
    const data = [];
    for (const people of mentions) {
      const elements = people.split(",");
      for (const element of elements) {
        data.push(element);
      }
    }
    video.mentionPeople = data;
    video.isOriginalAudio = req.body.isOriginalAudio;
    video.showVideo = parseInt(req.body.showVideo);
    video.allowComment = req.body.allowComment;
    video.duration = req.body.duration;
    video.size = req.body.size;
    video.thumbnail = req.files.thumbnail ? config.baseURL + req.files.thumbnail[0].path : null;
    video.screenshot = req.files.screenshot ? config.baseURL + req.files.screenshot[0].path : null;
    video.song = !song ? null : song._id;
    video.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });
    await video.save();

    user.video += 1;
    await user.save();

    for (const people of mentions) {
      const elements = people.split(",");
      for (const element of elements) {
        const mentionsUser = await User.findOne({ username: element });

        if (mentionsUser) {
          const payload = {
            to: mentionsUser.fcmToken,
            notification: {
              title: `${user.name} is mention you in their reels`,
            },
            data: {
              data: [
                {
                  _id: video._id,
                  hashtag: video.hashtag,
                  mentionPeople: video.mentionPeople,
                  isOriginalAudio: video.isOriginalAudio,
                  like: video.like,
                  comment: video.comment,
                  allowComment: video.allowComment,
                  showVideo: video.showVideo,
                  isDelete: video.isDelete,
                  userId: video.userId ? video.userId._id : "",
                  video: video.video,
                  location: video.location,
                  caption: video.caption,
                  thumbnail: video.thumbnail,
                  screenshot: video.screenshot,
                  song: video.song,
                  name: video.userId ? video.userId.name : "",
                  userImage: video.userId ? video.userId.image : "",
                  isVIP: video.userId ? video.userId.isVIP : false,
                },
              ],
              type: "RELITE",
            },
          };

          await fcm.send(payload, (err, res) => {
            if (err) {
              console.log(err);
            }
          });
        }
      }
    }
    return res.status(200).json({ status: true, message: "Success!!" });
  } catch (error) {
    deleteFiles(req?.files);
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};

// create Fake video
exports.uploadFakeVideo = async (req, res) => {
  try {
    if (!req.body.userId || !req.files.screenshot) return res.status(200).json({ status: false, message: "Invalid Details!" });

    const user = await User.findById(req.body.userId);

    if (!user) {
      deleteFiles(req?.files);
      return res.status(200).json({ status: false, message: "User does not Exist!" });
    }

    let song;

    if (req.body.songId) {
      song = await Song.findById(req.body.songId);
      if (!song) {
        deleteFiles(req?.files);
        return res.status(200).json({ status: false, message: "Song does not Exist!" });
      }
    }

    var removeComa = req.body.hashtag.replace(/,\s*$/, "");

    var hashtagList = removeComa.split(",");

    if (hashtagList.length > 0) {
      hashtagList.map((hashtag) => {
        const h = hashtag.toLowerCase();
        if (h !== "" || h !== " ") {
          Hashtag.findOneAndUpdate({ hashtag: h }, {}, { upsert: true }, function (err) {
            // console.log(err)
          });
        }
      });
    }

    const video = new Video();

    video.userId = user._id;

    if (req.body.fakeVideoType == 0) {
      video.video = req.body.video ? req.body.video : null;
      video.fakeVideoType = req.body.fakeVideoType ? req.body.fakeVideoType : null;
    }

    if (req.body.fakeVideoType == 1) {
      video.video = req.files.video ? config.baseURL + req.files.video[0].path : null;
      video.fakeVideoType = req.body.fakeVideoType ? req.body.fakeVideoType : null;
    }

    video.hashtag = hashtagList;
    video.location = req.body.location;
    video.caption = req.body.caption;
    video.mentionPeople = req.body.mentionPeople;
    video.isOriginalAudio = req.body.isOriginalAudio;
    video.allowComment = req.body.allowComment;
    video.duration = req.body.duration;
    video.size = req.body.size;
    video.thumbnail = req.files.thumbnail ? config.baseURL + req.files.thumbnail[0].path : null;
    video.screenshot = req.files.screenshot ? config.baseURL + req.files.screenshot[0].path : null;
    video.song = !song ? null : song._id;
    video.isFake = true;
    video.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    await video.save();

    res.status(200).json({ status: true, message: "Success!!", video });
    user.video += 1;
    await user.save();
  } catch (error) {
    deleteFiles(req?.files);
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};

// update Fake video
exports.updateFakeVideo = async (req, res) => {
  try {
    let video = await Video.findById(req.query.videoId);
    if (!video) {
      deleteFiles(req?.files);
      return res.status(200).json({ status: false, message: "Song does not Exist!" });
    }

    let song;
    if (req.body.songId) {
      song = await Song.findById(req.body.songId);
      if (!song) {
        deleteFiles(req?.files);
        return res.status(200).json({ status: false, message: "Song does not Exist!" });
      }
    }

    var removeComa = req.body?.hashtag?.replace(/,\s*$/, "");
    var hashtagList = removeComa?.split(",");
    if (hashtagList?.length > 0) {
      hashtagList.map((hashtag) => {
        const h = hashtag.toLowerCase();
        if (h !== "" || h !== " ") {
          Hashtag.findOneAndUpdate({ hashtag: h }, {}, { upsert: true }, function (err) {
            // console.log(err)
          });
        }
      });
    }

    if ((req.files.video && req.body.fakeVideoType == 1) || (req.body.video && req.body.fakeVideoType == 0)) {
      if (video.fakeVideoType == 1) {
        var video_ = video.video?.split("storage");
        if (video_) {
          if (fs.existsSync("storage" + video_[1])) {
            fs.unlinkSync("storage" + video_[1]);
          }
        }
      }
      if (req.body.fakeVideoType == 0) {
        video.video = req.body?.video;
      } else {
        video.video = config.baseURL + req.files?.video[0].path;
      }
      video.fakeVideoType = req.body?.fakeVideoType;
    }

    if (req.body.userId && video.userId.toString !== req.body.userId) {
      await User.updateOne(
        { _id: req.body.userId },
        {
          $inc: {
            video: 1,
          },
        },
        { new: true }
      );
      await User.updateOne(
        { _id: video.userId.toString() },
        {
          $inc: {
            video: -1,
          },
        }
      ).where({ video: { $gt: 0 } });
      video.userId = req.body?.userId;
    }
    video.hashtag = hashtagList?.length > 0 ? hashtagList : video.hashtag;
    video.location = req.body.location ? req.body.location : video.location;
    video.caption = req.body.caption ? req.body.caption : video.caption;
    video.mentionPeople = req.body.mentionPeople ? req.body.mentionPeople : video.mentionPeople;
    video.isOriginalAudio = req.body.isOriginalAudio ? req.body.isOriginalAudio : video.isOriginalAudio;
    video.showVideo = req.body.showVideo ? parseInt(req.body.showVideo) : video.showVideo;
    video.allowComment = req.body.allowComment ? req.body.allowComment : video.allowComment;
    video.duration = req.body.duration ? req.body.duration : video.duration;
    video.size = req.body.size ? req.body.size : video.size;
    video.thumbnail = req.files.thumbnail ? config.baseURL + req.files.thumbnail[0].path : video.thumbnail;
    video.screenshot = req.files.screenshot ? config.baseURL + req.files.screenshot[0].path : video.screenshot;
    video.song = !song ? video.song : song._id;
    video.isFake = true;
    video.comment = await Comment.find({ video: video._id }).countDocuments();
    video.date = new Date().toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
    });

    await video.save();
    video = await Video.findById(req.query.videoId).populate("userId");

    return res.status(200).json({ status: true, message: "Success!!", video });
  } catch (error) {
    deleteFiles(req?.files);
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};

// get video list
exports.getVideo = async (req, res) => {
  try {
    const user = await User.findById(req.query.userId);
    if (!user) return res.status(200).json({ status: false, message: "User does not found!" });

    let query = {};
    if (req.query.type !== "ALL") {
      query = { userId: user._id };
    }

    const fakeVideo = await Video.aggregate([
      {
        $match: { ...query, isDelete: false, isFake: true },
      },
      {
        $lookup: {
          from: "favorites",
          let: {
            videoId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$video", "$$videoId"] }, { $eq: ["$user", user._id] }],
                },
              },
            },
          ],
          as: "favorite",
        },
      },
      {
        $unwind: {
          path: "$favorite",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: false,
        },
      },

      {
        $lookup: {
          from: "comments",
          as: "comment",
          let: {
            videoId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ["$video", "$$videoId"],
                },
              },
            },
            {
              $lookup: {
                from: "users",
                localField: "userId",
                foreignField: "_id",
                as: "userId",
              },
            },
            { $unwind: { path: "$userId", preserveNullAndEmptyArrays: false } },
            { $match: { "userId.isBlock": false } },
          ],
        },
      },
      { $match: { "user.isBlock": false } },
      {
        $sort: { date: -1 },
      },
      {
        $project: {
          userId: "$user._id",
          name: "$user.name",
          userImage: "$user.image",
          isVIP: "$user.isVIP",
          isOriginalAudio: 1,
          like: 1,
          comment: { $size: "$comment" },
          allowComment: 1,
          showVideo: 1,
          userId: 1,
          video: 1,
          isFake: 1,
          location: 1,
          caption: 1,
          thumbnail: 1,
          screenshot: 1,
          isDelete: 1,
          isLike: {
            $cond: [{ $eq: [user._id, "$favorite.user"] }, true, false],
          },
          hashtag: 1,
          mentionPeople: 1,
          song: null,
        },
      },
      {
        $facet: {
          video: [
            { $skip: req.query.start ? parseInt(req.query.start) : 0 }, // how many records you want to skip
            { $limit: req.query.limit ? parseInt(req.query.limit) : 20 },
          ],
        },
      },
    ]);

    const video = await Video.aggregate([
      {
        $match: { ...query, isDelete: false, isFake: false },
      },
      {
        $lookup: {
          from: "favorites",
          let: {
            videoId: "$_id",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$video", "$$videoId"] }, { $eq: ["$user", user._id] }],
                },
              },
            },
          ],
          as: "favorite",
        },
      },
      {
        $unwind: {
          path: "$favorite",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "songs",
          localField: "song",
          foreignField: "_id",
          as: "song",
        },
      },
      {
        $unwind: {
          path: "$song",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: false,
        },
      },
      { $match: { "user.isBlock": false } },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "video",
          as: "comment",
        },
      },
      {
        $lookup: {
          from: "users",
          let: { userId: "$mentionPeople" },
          pipeline: [
            {
              $match: { $expr: { $in: ["$username", "$$userId"] } },
            },
            {
              $project: {
                name: 1,
                username: 1,
                // image: 1,
              },
            },
          ],
          as: "mentionPeople",
        },
      },
      {
        $sort: { date: -1 },
      },
      {
        $project: {
          userId: "$user._id",
          name: "$user.name",
          userImage: "$user.image",
          isVIP: "$user.isVIP",
          isOriginalAudio: 1,
          like: 1,
          comment: { $size: "$comment" },
          allowComment: 1,
          showVideo: 1,
          userId: 1,
          video: 1,
          isFake: 1,
          location: 1,
          caption: 1,
          thumbnail: 1,
          screenshot: 1,
          isDelete: 1,
          isLike: {
            $cond: [{ $eq: [user._id, "$favorite.user"] }, true, false],
          },
          hashtag: 1,
          mentionPeople: 1,
          song: { $ifNull: ["$song", null] },
        },
      },
      {
        $facet: {
          video: [
            { $skip: req.query.start ? parseInt(req.query.start) : 0 }, // how many records you want to skip
            { $limit: req.query.limit ? parseInt(req.query.limit) : 20 },
          ],
        },
      },
    ]);

    const setting = await Setting.findOne({});
    if (setting?.isFake) {
      return res.status(200).json({
        status: true,
        message: "Success!!",
        video: [...video[0].video, ...fakeVideo[0].video],
      });
    } else {
      return res.status(200).json({
        status: true,
        message: "Success!!",
        video: video[0].video,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};

// get video by id
exports.getVideoById = async (req, res) => {
  try {
    const video = await Video.aggregate([
      {
        $match: { _id: mongoose.Types.ObjectId(req.query.videoId) },
      },
      {
        $lookup: {
          from: "favorites",
          let: {
            videoId: "$_id",
            userId: "$userId",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [{ $eq: ["$video", "$$videoId"] }, { $eq: ["$user", "$$userId"] }],
                },
              },
            },
          ],
          as: "favorite",
        },
      },
      {
        $unwind: {
          path: "$favorite",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "songs",
          localField: "song",
          foreignField: "_id",
          as: "song",
        },
      },
      {
        $unwind: {
          path: "$song",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "video",
          as: "comment",
        },
      },
      {
        $unwind: {
          path: "$user",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: "users",
          let: { userId: "$mentionPeople" },
          pipeline: [
            {
              $match: { $expr: { $in: ["$username", "$$userId"] } },
            },
            {
              $project: {
                name: 1,
                username: 1,
                // image: 1,
              },
            },
          ],
          as: "mentionPeople",
        },
      },
      { $match: { "user.isBlock": false } },
      {
        $sort: { date: -1 },
      },
      {
        $project: {
          userId: "$user._id",
          name: "$user.name",
          userImage: "$user.image",
          isVIP: "$user.isVIP",
          isOriginalAudio: 1,
          like: 1,
          comment: { $size: "$comment" },
          allowComment: 1,
          showVideo: 1,
          userId: 1,
          video: 1,
          location: 1,
          caption: 1,
          thumbnail: 1,
          screenshot: 1,
          isDelete: 1,
          isLike: {
            $cond: [{ $eq: ["$user._id", "$favorite.user"] }, true, false],
          },
          hashtag: 1,
          mentionPeople: 1,
          song: { $ifNull: ["$song", null] },
        },
      },
      {
        $facet: {
          video: [
            { $skip: req.query.start ? parseInt(req.query.start) : 0 }, // how many records you want to skip
            { $limit: req.query.limit ? parseInt(req.query.limit) : 20 },
          ],
        },
      },
    ]);

    return res.status(200).json({
      status: video[0].video.length > 0 ? true : false,
      message: video[0].video.length > 0 ? "Success!!" : "Video does not Exist !",
      video: video[0].video.length > 0 ? video[0].video : [],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};

// delete video
exports.destroy = async (req, res) => {
  try {
    const video = await Video.findById(req.query.videoId);
    if (!video) return res.status(200).json({ status: false, message: "Video does not Exist!" });

    const video_ = video.video?.split("storage");
    if (video_) {
      if (fs.existsSync("storage" + video_[1])) {
        fs.unlinkSync("storage" + video_[1]);
      }
    }
    const thumbnail = video.thumbnail?.split("storage");
    if (thumbnail) {
      if (fs.existsSync("storage" + thumbnail[1])) {
        fs.unlinkSync("storage" + thumbnail[1]);
      }
    }
    const screenshot = video.screenshot?.split("storage");
    if (screenshot) {
      if (fs.existsSync("storage" + screenshot[1])) {
        fs.unlinkSync("storage" + screenshot[1]);
      }
    }

    await Comment.deleteMany({ video: video._id });
    await Favorite.deleteMany({ video: video._id });

    video.comment = 0;
    video.like = 0;
    video.isDelete = true;
    await video.save();

    res.status(200).json({ status: true, message: "Success!!" });
    const user = await User.findById(video?.userId);
    if (user) {
      user.video = user.video > 0 ? user.video - 1 : 0;
      await user.save();
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};

// allow disallow comment on relite [frontend]
exports.allowDisallowComment = async (req, res) => {
  try {
    const video = await Video.findById(req.params.videoId).populate("userId song");
    if (!video) return res.status(200).json({ status: false, message: "Video does not Exist!" });

    video.allowComment = !video.allowComment;
    video.comment = await Comment.find({ video: video._id }).countDocuments();
    await video.save();

    return res.status(200).json({ status: true, message: "Success!!", video });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};

// get all Relite By Song
exports.getReliteBySong = async (req, res) => {
  try {
    if (!req.query.songId || !req.query.userId) return res.status(200).json({ status: false, message: "Invalid Details !!" });

    const song = await Song.findById(req.query.songId);
    if (!song) return res.status(200).json({ status: false, message: "Song does not exist!" });

    const video = await Video.find({ song: req.query.songId }).sort({
      createdAt: -1,
    });
    return res.status(200).send({
      status: true,
      message: "Success",
      video,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};


// allow videoDetail [adminPanel]
exports.videoDetail = async (req, res) => {
  try {
    const video = await Video.findById(req.query.videoId).populate("userId song");
    if (!video)
      return res
        .status(200)
        .json({ status: false, message: "Video does not Exist!" });
    const comment = await Comment.find({ video: video?._id }).countDocuments();

    return res
      .status(200)
      .json({
        status: true,
        message: "Success!!",
        video: { ...video._doc, comment },
      });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || "Server Error" });
  }
};