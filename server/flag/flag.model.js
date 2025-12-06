const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const FlagSchema = new Schema(
  {
    name: String,
    flag: String,
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

module.exports = mongoose.model("Flag", FlagSchema);
