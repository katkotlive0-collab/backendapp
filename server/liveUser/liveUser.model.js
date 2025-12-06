const mongoose = require("mongoose");

const liveUserSchema = new mongoose.Schema(
  {
    name: String,
    country: String,
    image: String,
    view: { type: Array, default: [] },
    age: Number,
    token: String,
    channel: String,
    rCoin: Number,
    diamond: Number,
    username: String,
    background: String,
    countryFlagImage: String,
    isVIP: Boolean,
    liveUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    agoraUID: { type: Number, default: 0 },
    liveStreamingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "livestreaminghistories",
    },
    isPublic: { type: Boolean, default: true },
    expiration_date: { type: Date, required: true, expires: 0 }, //for liveUsers deleted after 15 min of when user is live
    filter: { type: String, default: '' },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

liveUserSchema.index({ liveUserId: 1 });
liveUserSchema.index({ liveStreamingId: 1 });

module.exports = mongoose.model("LiveUser", liveUserSchema);
