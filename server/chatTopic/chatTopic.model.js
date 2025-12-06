const mongoose = require("mongoose");

const chatTopicSchema = new mongoose.Schema(
  {
    senderUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    receiverUser: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    chat: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);


chatTopicSchema.index({ senderUser: 1 });
chatTopicSchema.index({ receiverUser: 1 });

module.exports = mongoose.model("ChatTopic", chatTopicSchema);
