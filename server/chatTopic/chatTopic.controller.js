const ChatTopic = require("./chatTopic.model");

const User = require("../user/user.model");
const Setting = require("../setting/setting.model");

const dayjs = require("dayjs");
const arrayShuffle = require("shuffle-array");

exports.store = async (req, res) => {
  try {
    if (!req.body.senderUserId || !req.body.receiverUserId) return res.status(200).json({ status: false, message: "Invalid Details!" });

    const senderUser = await User.findById(req.body.senderUserId);
    if (!senderUser) return res.status(200).json({ status: false, message: "User does not Exist!" });
    const receiverUser = await User.findById(req.body.receiverUserId);
    if (!receiverUser) return res.status(200).json({ status: false, message: "User dose not Exist!" });

    console.log("senderUser._id", senderUser._id);
    console.log("receiverUser._id", receiverUser._id);

    const chatTopic = await ChatTopic.findOne({
      $and: [{ senderUser: senderUser._id }, { receiverUser: receiverUser._id }],
    });
    console.log("chatTopic", chatTopic);

    if (chatTopic) {
      return res.status(200).json({ status: true, message: "Success!!", chatTopic });
    } else {
      const chatTopic2 = await ChatTopic.findOne({
        $and: [{ receiverUser: senderUser._id }, { senderUser: receiverUser._id }],
      });
      console.log("chatTopic2", chatTopic2);

      if (chatTopic2) {
        return res.status(200).json({ status: true, message: "Success!!", chatTopic: chatTopic2 });
      }

      const newChatTopic = new ChatTopic();
      newChatTopic.senderUser = senderUser._id;
      newChatTopic.receiverUser = receiverUser._id;
      await newChatTopic.save();

      return res.status(200).json({ status: true, message: "Success!!", chatTopic: newChatTopic });
    }
  } catch (error) {
    return res.status(500).json({
      status: false,
      error: error.message || "Internal Server Error !",
    });
  }
};

exports.getChatList = async (req, res) => {
  try {
    const start = req.query.start ? parseInt(req.query.start) : 0;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;

    const user = await User.findById(req.query.userId);
    if (!user) {
      return res.status(200).json({ status: false, message: "User does not Exist!" });
    }

    const list = await ChatTopic.aggregate([
      {
        $match: { $or: [{ senderUser: user._id }, { receiverUser: user._id }] },
      },
      {
        $lookup: {
          from: "users",
          as: "user",
          let: {
            receiverUserIds: "$receiverUser",
            senderUserIds: "$senderUser",
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $cond: {
                    if: { $eq: ["$$senderUserIds", user._id] },
                    then: { $eq: ["$$receiverUserIds", "$_id"] },
                    else: { $eq: ["$$senderUserIds", "$_id"] },
                  },
                },
              },
            },
            {
              $project: {
                name: 1,
                username: 1,
                image: 1,
                country: 1,
                isVIP: 1,
                isFake: 1,
              },
            },
          ],
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
          from: "chats",
          localField: "chat",
          foreignField: "_id",
          as: "chat",
        },
      },
      {
        $unwind: {
          path: "$chat",
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          _id: 0,
          topic: "$_id",
          message: "$chat.message",
          date: "$chat.date", //
          createdAt: "$chat.createdAt", //

          // chatDate: {
          //   $dateFromString: {
          //     dateString: "$chat.date",
          //   },
          // },

          userId: "$user._id",
          name: "$user.name",
          username: "$user.username",
          image: "$user.image",
          country: "$user.country",
          isVIP: "$user.isVIP",
          isFake: "$user.isFake",
        },
      },
      {
        $addFields: {
          isFake: false,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    const paginatedList = await list?.slice(start, start + limit);

    let now = dayjs();

    const chatList = paginatedList.map((data) => ({
      ...data,
      time:
        now.diff(data.createdAt, "minute") === 0
          ? "Just Now"
          : now.diff(data.createdAt, "minute") <= 60 && now.diff(data.createdAt, "minute") >= 0
          ? now.diff(data.createdAt, "minute") + " minutes ago"
          : now.diff(data.createdAt, "hour") >= 24
          ? dayjs(data.createdAt).format("DD MMM, YYYY")
          : now.diff(data.createdAt, "hour") + " hour ago",
    }));

    const setting = await Setting.findOne({}).sort({ createdAt: -1 });

    if (!setting?.isFake) {
      console.log("real");

      return res.status(200).json({
        status: true,
        message: "Success",
        chatList: chatList,
      });
    } else {
      const fakeData = await User.find({ isFake: true });
      const fakeUser = await arrayShuffle(fakeData);

      const fakeStart = (await start) - paginatedList.length;
      const fakeLimit = await Math.min(limit, fakeUser.length - fakeStart + 1);

      const fakeChatList = await fakeUser.slice(fakeStart, fakeStart + fakeLimit).map((element) => ({
        topic: null,
        message: "hello !",
        date: null,
        chatDate: null,
        userId: element._id,
        name: element.name,
        username: element.username,
        image: element.image,
        country: element.country,
        isVIP: element.isVIP,
        link: element.link,
        time: "Just now",
        isFake: true,
      }));

      return res.status(200).json({
        status: true,
        message: "Success",
        chatList: [...chatList, ...fakeChatList],
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      status: false,
      error: error.message || "Internal Server Error",
    });
  }
};
