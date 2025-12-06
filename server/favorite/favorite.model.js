const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FavoriteSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    post: { type: Schema.Types.ObjectId, ref: "Post", default: null },
    video: { type: Schema.Types.ObjectId, ref: "Video", default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

FavoriteSchema.index({ video: 1 });
FavoriteSchema.index({ post: 1 });
FavoriteSchema.index({ user: 1 });

module.exports = mongoose.model("Favorite", FavoriteSchema);
