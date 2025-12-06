const mongoose = require("mongoose");

const coinPlanSchema = new mongoose.Schema(
  {
    diamonds: Number,
    dollar: Number,
    rupee: Number,
    tag: String,
    productKey: String,
    isDelete: { type: Boolean, default: false },
    isTop: { type: Boolean, default: false },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);
coinPlanSchema.index({ isDelete: 1 });

module.exports = mongoose.model("CoinPlan", coinPlanSchema);
