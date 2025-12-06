const mongoose = require("mongoose");

const hashtagSchema = new mongoose.Schema(
  {
    hashtag: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Hashtag", hashtagSchema);
