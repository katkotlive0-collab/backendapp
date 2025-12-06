const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    post: String,
    hashtag: { type: Array, default: null },
    // mentionPeople: { type: Array, default: null },
    mentionPeople: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'users',
        },
      ],
      default: [],
    },
    location: { type: String, default: '' },
    caption: { type: String, default: '' },
    like: { type: Number, default: 0 },
    comment: { type: Number, default: 0 },
    showPost: { type: Number, enum: [0, 1], default: 0 }, // 0:public, 1:followers
    allowComment: { type: Boolean, default: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isDelete: { type: Boolean, default: false },
    isFake: { type: Boolean, default: false },
    fakePostType: { type: Number, enum: [0, 1], default: 0 }, // 0:link  1 :file
    date: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
postSchema.index({ userId: 1 });
postSchema.index({ isFake: 1 });
postSchema.index({ isDelete: 1 });
module.exports = mongoose.model('Post', postSchema);
