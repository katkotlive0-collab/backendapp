const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    description: String,
    date: {
      type: String,
      default: new Date().toLocaleString("en-US", {
        timeZone: "Asia/Kolkata",
      }),
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
reportSchema.index({ fromUserId: 1 });
reportSchema.index({ toUserId: 1 });

module.exports = mongoose.model("Report", reportSchema);
