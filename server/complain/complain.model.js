const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const complainSchema = new Schema(
  {
    message: String,
    contact: String,
    image: { type: String, default: null },
    solved: { type: Boolean, default: false },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
complainSchema.index({ solved: 1 });
complainSchema.index({ userId: 1 });

module.exports = mongoose.model("Complain", complainSchema);
