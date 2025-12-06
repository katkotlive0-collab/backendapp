const mongoose = require("mongoose");

const songSchema = new mongoose.Schema(
  {
    image: String,
    title: String,
    singer: String,
    song: String,
    isDelete: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

songSchema.index({ isDelete: 1 });
module.exports = mongoose.model("Song", songSchema);
