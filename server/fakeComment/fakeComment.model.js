const mongoose = require("mongoose");

const fakeCommentSchema = new mongoose.Schema(
  {
    comment: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("FakeComment", fakeCommentSchema);
