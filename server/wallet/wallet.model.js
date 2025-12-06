const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    type: { type: Number, enum: [0, 1, 2, 3, 4, 5, 6, 7, 8] }, // 0:gift, 1:convert, 2:purchase [diamond purchase], 3:call, 4:ad[from watching ad], 5:login bonus, 6:referral bonus, 7: cashOut, 8: admin [admin add or less the rCoin or diamond through admin panel]
    diamond: { type: Number, default: null },
    otherUserDiamond: { type: Number, default: null },
    rCoin: { type: Number, default: null },
    otherUserRCoin: { type: Number, default: null },
    otherUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    date: String,
    isIncome: { type: Boolean, default: true },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoinPlan',
      default: null,
    },
    paymentGateway: { type: String, default: null },

    //this field for call
    callConnect: { type: Boolean, default: false },
    callStartTime: { type: String, default: null },
    callEndTime: { type: String, default: null },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

walletSchema.index({ userId: 1 });
walletSchema.index({ type: 1 });
walletSchema.index({ diamond: 1 });
walletSchema.index({ rCoin: 1 });
walletSchema.index({ otherUserId: 1 });
walletSchema.index({ isIncome: 1 });
walletSchema.index({ callConnect: 1 });

module.exports = mongoose.model('Wallet', walletSchema);
