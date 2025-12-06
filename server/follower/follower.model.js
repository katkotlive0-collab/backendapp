const mongoose = require("mongoose");

const followerSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

followerSchema.index({ fromUserId: 1 });
followerSchema.index({ toUserId: 1 });

module.exports = mongoose.model("Follower", followerSchema);
