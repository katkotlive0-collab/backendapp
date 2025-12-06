const express = require("express");
const route = express.Router();

//admin route
const AdminRoute = require("./server/admin/admin.route");
route.use("/admin", AdminRoute);

//banner route
const BannerRoute = require("./server/banner/banner.route");
route.use("/banner", BannerRoute);

//coinPlan route
const CoinPlanRoute = require("./server/coinPlan/coinPlan.route");
route.use("/coinPlan", CoinPlanRoute);

//vipPlan route
const VIPPlanRoute = require("./server/vipPlan/vipPlan.route");
route.use("/vipPlan", VIPPlanRoute);

//gift category route
const GiftCategoryRoute = require("./server/giftCategory/giftCategory.route");
route.use("/giftCategory", GiftCategoryRoute);

//gift route
const GiftRoute = require("./server/gift/gift.route");
route.use("/gift", GiftRoute);

//user route
const UserRoute = require("./server/user/user.route");
route.use("/", UserRoute);

//follower route
const FollowerRoute = require("./server/follower/follower.route");
route.use("/", FollowerRoute);

//location route
const LocationRoute = require("./server/location/location.route");
route.use("/location", LocationRoute);

const LoginRoute = require("./server/login/login.route");
route.use("/", LoginRoute);
//song route
const SongRoute = require("./server/song/song.route");
route.use("/song", SongRoute);

//hashtag route
const HashtagRoute = require("./server/hashtag/hashtag.route");
route.use("/hashtag", HashtagRoute);

//level route
const LevelRoute = require("./server/level/level.route");
route.use("/level", LevelRoute);

//post route
const PostRoute = require("./server/post/post.route");
route.use("/", PostRoute);

//video route
const VideoRoute = require("./server/video/video.route");
route.use("/", VideoRoute);
//theme route
const ThemeRoute = require("./server/theme/theme.route");
route.use("/theme", ThemeRoute);
//favorite route
const FavoriteRoute = require("./server/favorite/favorite.route");
route.use("/", FavoriteRoute);

//comment route
const CommentRoute = require("./server/comment/comment.route");
route.use("/comment", CommentRoute);

//setting route
const SettingRoute = require("./server/setting/setting.route");
route.use("/setting", SettingRoute);

//complain route
const ComplainRoute = require("./server/complain/complain.route");
route.use("/complain", ComplainRoute);

//advertisement route
const AdvertisementRoute = require("./server/advertisement/advertisement.route");
route.use("/advertisement", AdvertisementRoute);

//redeem route
const RedeemRoute = require("./server/redeem/redeem.route");
route.use("/redeem", RedeemRoute);

//wallet route
const WalletRoute = require("./server/wallet/wallet.route");
route.use("/", WalletRoute);

//live user route
const LiveUserRoute = require("./server/liveUser/liveUser.route");
route.use("/", LiveUserRoute);

//live streaming history route
const LiveStreamingHistoryRoute = require("./server/liveStreamingHistory/liveStreamingHistory.route");
route.use("/", LiveStreamingHistoryRoute);

//chat topic route
const ChatTopicRoute = require("./server/chatTopic/chatTopic.route");
route.use("/", ChatTopicRoute);

// fake comment route
const FakeCommentRoute = require("./server/fakeComment/fakeComment.route");
route.use("/fakeComment", FakeCommentRoute);

//chat route
const ChatRoute = require("./server/chat/chat.route");
route.use("/", ChatRoute);

//notification route
const NotificationRoute = require("./server/notification/notification.route");
route.use("/", NotificationRoute);

//dashboard route
const DashboardRoute = require("./server/dashboard/dashboard.route");
route.use("/dashboard", DashboardRoute);

//report route
const ReportRoute = require("./server/report/report.route");
route.use("/report", ReportRoute);

//sticker route
const StickerRoute = require("./server/sticker/sticker.route");
route.use("/sticker", StickerRoute);

module.exports = route;