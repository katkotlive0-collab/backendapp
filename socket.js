const moment = require('moment');
const config = require('./config');

//model
const { offlineUser } = require('./server/user/user.controller');
const Wallet = require('./server/wallet/wallet.model');
const User = require('./server/user/user.model');
const Follower = require('./server/follower/follower.model');
const LiveUser = require('./server/liveUser/liveUser.model');
const Chat = require('./server/chat/chat.model');
const ChatTopic = require('./server/chatTopic/chatTopic.model');
const LiveStreamingHistory = require('./server/liveStreamingHistory/liveStreamingHistory.model');

//FCM node
var FCM = require('fcm-node');
var fcm = new FCM(config.SERVER_KEY);

//socket io
io.on('connect', (socket) => {
  console.log('Connection done');

  const { globalRoom } = socket.handshake.query;
  console.log('socket.handshake.query ==== : ', socket.handshake.query);
  console.log('globalRoom connected: ', globalRoom);

  const id = globalRoom && globalRoom.split(':')[1];
  console.log('id: ', id);

  socket.join(globalRoom);

  //live-streaming
  socket.on('liveRoomConnect', async (data) => {
    console.log('liveRoomConnect  connected:   ', data);
    socket.join(data?.liveStreamingId);
    io.in(data?.liveStreamingId).emit('liveRoomConnect', data);
  });

  socket.on('liveReJoin', async (data) => {
    console.log('liveReJoin  listen:   ', data);
    let liveUserModel;
    socket.join(data?.liveStreamingId);
    if (data.isLive) {
      liveUserModel = await LiveUser.findOne({ liveUserId: data?.userId });
      if (!liveUserModel) {
        console.log('.............');
        io.in(data.liveStreamingId).emit('liveReJoin', false);
        return;
      }
    }
    io.in(data?.liveStreamingId).emit('liveReJoin', true);
  });

  socket.on('comment', async (data) => {
    console.log('comment data:  ', data);
    const dataOfComment = JSON.parse(data);
    socket.join(dataOfComment?.liveStreamingId);

    const liveStreamingHistory = await LiveStreamingHistory.findById(
      dataOfComment?.liveStreamingId
    );
    if (liveStreamingHistory) {
      liveStreamingHistory.comments += 1;
      await liveStreamingHistory.save();
    }
    io.in(dataOfComment?.liveStreamingId).emit('comment', data);
  });

  // live user send gift during live streaming [put entry on outgoing collection]
  socket.on('liveUserGift', async (data) => {
    console.log('liveUser Gift emit ======', data);
    socket.join(data.liveStreamingId);
    const user = await User.findById(data.userId).populate('level');

    if (user && data.coin <= user.diamond) {
      user.diamond -= data.coin;
      user.spentCoin += data.coin;
      await user.save();

      // if type=0 && otherUserId=null then gift sent by user during live streaming
      const outgoing = new Wallet();
      outgoing.userId = user._id;
      outgoing.diamond = data.coin;
      outgoing.type = 0;
      outgoing.isIncome = false;
      outgoing.otherUserId = null;
      outgoing.date = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
      });
      await outgoing.save();
      io.in(data.liveStreamingId).emit('gift', data, null, user);
    }
  });
  // normal user send gift during live streaming [put entry on income and outgoing collection]
  socket.on('normalUserGift', async (data) => {
    console.log('normalUser GIFT :', data);
    const senderUser = await User.findById(data.senderUserId).populate('level');
    const receiverUser = await User.findById(data.receiverUserId).populate(
      'level'
    );

    if (senderUser && data?.coin <= senderUser?.diamond) {
      senderUser.diamond -= data?.coin;
      senderUser.spentCoin += data?.coin;
      await senderUser.save();

      if (receiverUser) {
        const outgoing = new Wallet();
        outgoing.userId = senderUser._id;
        outgoing.diamond = data?.coin;
        outgoing.type = 0;
        outgoing.isIncome = false;
        outgoing.otherUserId = receiverUser._id;
        outgoing.date = new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
        });
        await outgoing.save();
        receiverUser.rCoin += data?.coin;
        await receiverUser.save();

        await LiveUser.updateOne(
          { liveUserId: receiverUser._id },
          { $inc: { rCoin: data?.coin } }
        );

        const income = new Wallet();

        income.userId = receiverUser._id;
        income.rCoin = data?.coin;
        income.type = 0;
        income.isIncome = true;
        income.otherUserId = senderUser._id;
        income.date = new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
        });

        await income.save();
      }
      await LiveStreamingHistory.updateOne(
        { _id: data.liveStreamingId },
        {
          $inc: { rCoin: data?.coin, gifts: 1 },
          $set: {
            endTime: new Date().toLocaleString('en-US', {
              timeZone: 'Asia/Kolkata',
            }),
          },
        }
      );
      console.log('senderUser', senderUser?.name);
      console.log('receiverUser', receiverUser?.name);
      io.in(data?.liveStreamingId).emit('gift', data, senderUser, receiverUser);
    } else {
      await LiveStreamingHistory.updateOne(
        { _id: data?.liveStreamingId },
        {
          endTime: new Date().toLocaleString('en-US', {
            timeZone: 'Asia/Kolkata',
          }),
        }
      );
    }
  });

  socket.on('addView', async (data) => {
    console.log('data in addView: ', data);

    const liveStreamingHistory = await LiveStreamingHistory.findById(
      data?.liveStreamingId
    );
    socket.join(data?.liveStreamingId);

    const liveUser = await LiveUser.findById(data?.liveUserMongoId);
    if (liveUser) {
      const joinedUserExist = await LiveUser.findOne({
        _id: liveUser._id,
        'view.userId': data?.userId,
      });

      if (joinedUserExist) {
        await LiveUser.updateOne(
          { _id: liveUser._id, 'view.userId': data.userId },
          {
            $set: {
              'view.$.userId': data?.userId,
              'view.$.image': data?.image,
              'view.$.name': data?.name,
              'view.$.gender': data?.gender,
              'view.$.country': data?.country,
              'view.$.isVIP': data?.isVIP,
              'view.$.isAdd': true,
            },
          }
        );
      } else {
        liveUser.view.push({
          userId: data?.userId,
          image: data?.image,
          country: data?.country,
          gender: data?.gender,
          name: data?.name,
          isVIP: data?.isVIP,
          isAdd: true,
        });

        await liveUser.save();
      }
    }

    const dataOfLiveUser = await LiveUser.findById(data.liveUserMongoId);

    if (liveStreamingHistory && dataOfLiveUser) {
      liveStreamingHistory.user = dataOfLiveUser.view.length;
      liveStreamingHistory.endTime = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
      });
      liveStreamingHistory.momentEndTime = moment(new Date()).format(
        'HH:mm:ss'
      );
      await liveStreamingHistory.save();

      const liveUser = await LiveUser.aggregate([
        { $match: { _id: dataOfLiveUser._id } },
        {
          $addFields: {
            view: { $size: '$view' },
          },
        },
      ]);

      io.in(data?.liveStreamingId).emit('view', dataOfLiveUser.view);
      io.in(data?.liveStreamingId).emit('seat', liveUser[0]);
    }
  });

  socket.on('lessView', async (data) => {
    console.log('lessView data: ', data);

    const liveStreamingHistory = await LiveStreamingHistory.findById(
      data?.liveStreamingId
    );

    const socket1 = await io.in('globalRoom:' + data?.userId).fetchSockets();
    socket1?.length
      ? socket1[0].join(data?.liveStreamingId)
      : console.log('socket1 not able to join in lessView');

    await LiveUser.updateOne(
      { _id: data?.liveUserMongoId, 'view.userId': data?.userId },
      {
        $set: {
          'view.$.isAdd': false,
        },
      }
    );
    const liveUser = await LiveUser.findOne({
      _id: data?.liveUserMongoId,
      'view.isAdd': true,
    });

    if (liveStreamingHistory) {
      liveStreamingHistory.endTime = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
      });
      liveStreamingHistory.momentEndTime = moment(new Date()).format(
        'HH:mm:ss'
      );
      await liveStreamingHistory.save();
    }

    const dataOfLiveUser = await LiveUser.aggregate([
      {
        $match: { _id: liveUser?._id },
      },
      { $addFields: { view: { $size: '$view' } } },
    ]);

    await io
      .in(data?.liveStreamingId)
      .emit('view', liveUser ? liveUser.view : []);
    await io.in(data?.liveStreamingId).emit('seat', dataOfLiveUser[0]);
    socket.leave(data?.liveStreamingId);
  });

  //misc
  socket.on('liveStreaming', (data) => {
    console.log('liveStreaming', data);
    console.log('LiveRoom liveStreaming ', liveRoom);

    io.in(liveRoom).emit('liveStreaming', data);
  });

  socket.on('simpleFilter', (data) => {
    console.log('simpleFilter', data);
    console.log('LiveRoom simpleFilter ', data?.liveStreamingId);
    io.in(data?.liveStreamingId).emit('simpleFilter', data);
  });

  socket.on('animatedFilter', (data) => {
    console.log('animatedFilter', data);
    console.log('LiveRoom animatedFilter ', data?.liveStreamingId);
    io.in(data?.liveStreamingId).emit('animatedFilter', data);
  });

  socket.on('gif', (data) => {
    console.log('gif', data);
    console.log('LiveRoom gif ', data?.liveStreamingId);
    io.in(data?.liveStreamingId).emit('gif', data);
  });

  socket.on('getUserProfile', async (data) => {
    console.log('getUserProfile data:  ', data);

    const user = await User.findById(data?.toUserId)
      .populate('level')
      .select(
        'name username uniqueId gender age image country bio followers following video post level isVIP'
      );
    if (user) {
      const follower = await Follower.findOne({
        fromUserId: data?.fromUserId,
        toUserId: user._id,
      });

      const userData = {
        ...user._doc,
        userId: user._id,
        isFollow: follower ? true : false,
      };

      io.in('globalRoom:' + data?.fromUserId.toString()).emit('data', userData);
    }
  });

  socket.on('blockedList', async (data) => {
    console.log('blockedList data:  ', data);

    const sockets = await io.in('globalRoom:' + data?.userId).fetchSockets();
    console.log('sockets in blockedList: ', sockets);

    sockets?.length
      ? sockets[0].join(data?.userId)
      : console.log('sockets not able to emit');

    const xyz = io.sockets.adapter.rooms.get(data?.userId);
    console.log('adapter sockets in blockedList ==================: ', xyz);

    io.in(data?.userId).emit('blockedList', data);
  });

  //chat
  socket.on('chat', async (data) => {
    console.log('data in chat:  ', data);

    const chatTopic = await ChatTopic.findById(data?.topic).populate(
      'receiverUser senderUser'
    );
    if (data.messageType === 'message') {
      let senderUserIdRoom = 'globalRoom:' + chatTopic?.senderUser?._id;
      let receiverIdRoom = 'globalRoom:' + chatTopic?.receiverUser?._id;

      if (chatTopic) {
        const chat = new Chat();

        chat.senderId = data?.senderId;
        chat.messageType = 'message';
        chat.message = data?.message;
        chat.image = null;
        chat.topic = chatTopic._id;
        chat.date = new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
        });
        await chat.save();

        chatTopic.chat = chat._id;
        await chatTopic.save();
        io.in(senderUserIdRoom).emit('chat', data);
        io.in(receiverIdRoom).emit('chat', data);
        let receiverUser, senderUser;
        if (
          chatTopic.senderUser &&
          chatTopic.senderUser._id.toString() === data.senderId.toString()
        ) {
          receiverUser = chatTopic.receiverUser;
          senderUser = chatTopic.senderUser;
        } else if (chatTopic.receiverUser && chatTopic.receiverUser._id) {
          receiverUser = chatTopic.senderUser;
          senderUser = chatTopic.receiverUser;
        }

        if (
          receiverUser &&
          !receiverUser.isBlock &&
          receiverUser.notification.message
        ) {
          const payload = {
            to: receiverUser.fcmToken,
            notification: {
              body: chat.message,
              title: senderUser.name,
            },
            data: {
              data: {
                topic: chatTopic._id,
                message: chat.message,
                date: chat.date,
                chatDate: chat.date,
                userId: senderUser._id,
                name: senderUser.name,
                username: senderUser.username,
                image: senderUser.image,
                country: senderUser.country,
                isVIP: senderUser.isVIP,
                time: 'Just Now',
              },
              type: 'MESSAGE',
            },
          };

          await fcm.send(payload, function (err, response) {
            if (err) {
              console.log('Something has gone wrong: ', err);
            } else {
              console.log('Successfully sent with response: ', response);
            }
          });
        }
      }
    } else {
      io.in('globalRoom:' + data?.senderId).emit('chat', data);
      io.in('globalRoom:' + chatTopic?.receiverUser._id.toString()).emit(
        'chat',
        data
      );
    }
  });

  //call
  socket.on('callRequest', async (data) => {
    console.log('callRequest data: ', data);

    io.in('globalRoom:' + data.userId1).emit('callRequest', data); // userId1 = receiver user , userId2 = caller user
  });

  socket.on('callConfirmed', async (data) => {
    console.log('callConfirmed data: ', data);
    io.in('globalRoom:' + data.userId2).emit('callConfirmed', data); // userId1 = receiver user , userId2 = caller user
  });

  socket.on('callAnswer', async (data) => {
    console.log('callAnswer data: ', data);

    if (data.isAccept) {
      const socket1 = await io.in('globalRoom:' + data?.userId1).fetchSockets();
      socket1?.length && socket1[0].join(data?.callRoomId);

      const socket2 = await io.in('globalRoom:' + data?.userId2).fetchSockets();
      socket2?.length && socket2[0].join(data?.callRoomId);
    } else {
      await User.updateMany(
        { callId: data?.callRoomId },
        { $set: { callId: '' } }
      );
    }
    io.in('globalRoom:' + data.userId2).emit('callAnswer', data); // userId1 = receiver user , userId2 = caller user
  });

  socket.on('callReceive', async (data) => {
    console.log('callReceive data: ', data);

    let callDetail = await Wallet.findById(data?.callRoomId);
    if (!callDetail) {
      callDetail = await Wallet.findById(data?.callId);
    }

    if (callDetail) {
      const user = await User.findById(callDetail.userId).populate('level');

      if (user && user.diamond >= data.coin) {
        user.diamond -= data.coin;
        user.spentCoin += data.coin;
        await user.save();

        await User.updateOne(
          { _id: callDetail.otherUserId },
          { $inc: { diamond: data.coin } }
        );

        callDetail.diamond += data.coin;
        callDetail.otherUserDiamond += data.coin;
        callDetail.callConnect = true;
        callDetail.callStartTime = new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
        });
        callDetail.callEndTime = new Date().toLocaleString('en-US', {
          timeZone: 'Asia/Kolkata',
        });
        await callDetail.save();

        io.in(data?.callRoomId).emit('callReceive', user?.name);
      } else {
        io.in(data?.callRoomId).emit('callReceive', null, user);
      }
    }
  });

  //when user decline the call
  socket.on('callCancel', async (data) => {
    console.log('call Cancelled data: ', data);

    const user1 = await User.findById(data?.userId1);
    if (user1) {
      user1.callId = '';
      await user1.save();
    }
    const user2 = await User.findById(data?.userId2);
    if (user2) {
      user2.callId = '';
      await user2.save();
    }
    io.in('globalRoom:' + data.userId1).emit('callCancel', data); // userId1 = receiver user , userId2 = caller user
  });

  socket.on('callDisconnect', async (callId) => {
    console.log('Call disconnect: ', callId);

    await User.updateMany({ callId: callId }, { $set: { callId: '' } });

    const callHistory = await Wallet.findById(callId);
    if (callHistory) {
      callHistory.callEndTime = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
      });
      await callHistory.save();
    }
  });

  socket.on('liveHostEnd', async (data) => {
    console.log('LiveHostEnd listen :: ', data);
    const liveStreamingHistory = await LiveStreamingHistory.findById(
      data?.liveStreamingId
    );
    if (liveStreamingHistory) {
      console.log('liveStreamingHistory in liveHostEnd:   ');

      liveStreamingHistory.endTime = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
      });
      liveStreamingHistory.duration = moment
        .utc(
          moment(new Date(liveStreamingHistory.endTime)).diff(
            moment(new Date(liveStreamingHistory.startTime))
          )
        )
        .format('HH:mm:ss');
      await liveStreamingHistory.save();
      console.log('liveStreamingHistory Updated in liveHostEnd:   ');
    }

    const liveUser = await LiveUser.findOne({
      liveUserId: data?.liveUserId,
      liveStreamingId: data?.liveStreamingId,
    });
    if (liveUser) await liveUser.deleteOne();

    const abc = io.sockets.adapter.rooms.get(data?.liveStreamingId);
    console.log('liveHostEnd before leave EMIT sockets : ====== ', abc);

    io.in(data?.liveStreamingId).emit('liveHostEnd', 'end');
    io.socketsLeave(data?.liveStreamingId);
  });
  socket.on('disconnect', async () => {
    console.log('One of sockets disconnected from our server.', globalRoom);

    if (globalRoom) {
      const socket1 = await io.in(globalRoom).fetchSockets();
      if (socket1?.length == 0) {
        console.log(
          'socket1?.length in Final disconnect:    ',
          socket1?.length
        );

        const liveUser = await LiveUser.findOne({ liveUserId: id });

        if (liveUser) {
          io.in(liveUser?.liveStreamingId.toString()).emit('liveHostEnd', 'end');
          io.socketsLeave(liveUser.liveStreamingId);

          //@todo : liveEndTime
          const liveStreamingHistory = await LiveStreamingHistory.findById(
            liveUser?.liveStreamingId
          );
          if (liveStreamingHistory) {
            console.log('liveStreamingHistory in liveHostEnd:   ');

            liveStreamingHistory.endTime = new Date().toLocaleString('en-US', {
              timeZone: 'Asia/Kolkata',
            });
            liveStreamingHistory.duration = moment
              .utc(
                moment(new Date(liveStreamingHistory.endTime)).diff(
                  moment(new Date(liveStreamingHistory.startTime))
                )
              )
              .format('HH:mm:ss');
            await liveStreamingHistory.save();
            console.log('liveStreamingHistory Updated in liveHostEnd:   ');
          }
          await liveUser.deleteOne();
        }

        const user = await User.findById(id);

        if (user && user.callId) {
          const callHistory = await Wallet.findById(user.callId);
          if (callHistory && callHistory.callEndTime == null) {
            console.log('callHistory in disconnect');

            callHistory.callEndTime = new Date().toLocaleString('en-US', {
              timeZone: 'Asia/Kolkata',
            });
            await callHistory.save();
          }
          await User.updateMany(
            { callId: user.callId },
            { $set: { callId: '' } }
          );
        }
        await offlineUser(id);
      }
    }
  });
});