const Setting = require("./setting.model");

// get setting data
exports.index = async (req, res) => {
  try {
    const setting = await Setting.findOne({});

    if (!setting) return res.status(200).json({ status: false, message: "No data found!" });

    return res.status(200).json({ status: true, message: "Success!!", setting });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};

exports.store = async (req, res) => {
  try {
    let setting = await Setting.findOne();

    if (!setting) {
      setting = new Setting();
      setting.referralBonus = 20;
      await setting.save();
    }

    return res.status(200).json({ status: true, message: "Success!!", setting });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};

// update the setting data
exports.update = async (req, res) => {
  try {
    const setting = await Setting.findById(req.params.settingId);

    if (!setting) return res.status(200).json({ status: false, message: "Setting data does not Exist!" });
    if (req.body.rCoinForDiamond && req.body?.rCoinForDiamond !== "0") {
      setting.rCoinForDiamond = Math.floor(req.body.rCoinForDiamond);
    }
    setting.referralBonus = req.body?.referralBonus ? Math.floor(req.body?.referralBonus) : setting.referralBonus;
    setting.agoraKey = req.body?.agoraKey ? req.body?.agoraKey : setting.agoraKey;
    setting.agoraCertificate = req.body.agoraCertificate ? req.body.agoraCertificate : setting.agoraCertificate;
    setting.maxSecondForVideo = req.body.maxSecondForVideo ? Math.floor(req.body.maxSecondForVideo) : setting.maxSecondForVideo;
    setting.privacyPolicyLink = req.body.privacyPolicyLink ? req.body.privacyPolicyLink : setting.privacyPolicyLink;
    setting.privacyPolicyText = req.body.privacyPolicyText ? req.body.privacyPolicyText : setting.privacyPolicyText;
    setting.chatCharge = req.body.chatCharge ? Math.floor(req.body.chatCharge) : setting.chatCharge;
    setting.maleCallCharge = req.body.maleCallCharge ? Math.floor(req.body.maleCallCharge) : setting.maleCallCharge;
    setting.femaleCallCharge = req.body.femaleCallCharge ? Math.floor(req.body.femaleCallCharge) : setting.femaleCallCharge;
    setting.googlePlayEmail = req.body.googlePlayEmail ? req.body.googlePlayEmail : setting.googlePlayEmail;
    setting.googlePlayKey = req.body.googlePlayKey ? req.body.googlePlayKey : setting.googlePlayKey;
    setting.stripePublishableKey = req.body.stripePublishableKey ? req.body.stripePublishableKey : setting.stripePublishableKey;
    setting.stripeSecretKey = req.body.stripeSecretKey ? req.body.stripeSecretKey : setting.stripeSecretKey;
    setting.currency = req.body.currency ? req.body.currency : setting.currency;
    // setting.diamond = req.body.diamond
    //   ? Math.floor(req.body.diamond)
    //   : setting.diamond;

    setting.minRcoinForCashOut = req.body.minRcoinForCaseOut ? Math.floor(req.body.minRcoinForCaseOut) : setting.minRcoinForCashOut;
    setting.rCoinForCashOut = req.body.rCoinForCashOut ? Math.floor(req.body.rCoinForCashOut) : setting.rCoinForCashOut;

    setting.vipDiamond = req.body.vipDiamond ? Math.floor(req.body.vipDiamond) : setting.vipDiamond;
    setting.paymentGateway = req.body.paymentGateway ? req.body.paymentGateway : setting.paymentGateway;
    setting.loginBonus = req.body.loginBonus ? Math.floor(req.body.loginBonus) : setting.loginBonus;

    setting.freeDiamondForAd = req.body.freeDiamondForAd ? Math.floor(req.body.freeDiamondForAd) : setting.freeDiamondForAd;
    setting.maxAdPerDay = req.body.maxAdPerDay ? Math.floor(req.body.maxAdPerDay) : setting.maxAdPerDay;

    await setting.save();

    return res.status(200).json({ status: true, message: "Success!!", setting });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};

// handle setting switch
exports.handleSwitch = async (req, res) => {
  try {
    const setting = await Setting.findById(req.params.settingId);

    if (!setting) return res.status(200).json({ status: false, message: "Setting data does not Exist!" });

    if (req.query.type === "googlePlay") {
      setting.googlePlaySwitch = !setting.googlePlaySwitch;
    } else if (req.query.type === "stripe") {
      setting.stripeSwitch = !setting.stripeSwitch;
    } else if (req.query.type === "fake") {
      setting.isFake = !setting.isFake;
    } else {
      setting.isAppActive = !setting.isAppActive;
    }

    await setting.save();

    return res.status(200).json({ status: true, message: "Success!!", setting });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ status: false, error: error.message || "Server Error" });
  }
};
