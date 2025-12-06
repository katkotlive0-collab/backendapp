const CoinPlan = require('./coinPlan.model');
const VIPPlan = require('../vipPlan/vipPlan.model');
const User = require('../user/user.model');
const Setting = require('../setting/setting.model');
const Wallet = require('../wallet/wallet.model');
const FakeUser = require('../../userCollection');
const FakeEmail = require('../../emailCollection');

//google play
const Verifier = require('google-play-billing-validator');

//get coin plans
exports.index = async (req, res) => {
  try {
    const coinPlan = await CoinPlan.find({ isDelete: false }).sort({
      diamonds: 1,
    });

    if (!coinPlan)
      return res.status(200).json({ status: false, message: 'No data found!' });

    return res
      .status(200)
      .json({ status: true, message: 'Success!!', coinPlan });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || 'Server Error' });
  }
};

// create coin plan
exports.store = async (req, res) => {
  try {
    if (
      !req.body.diamonds ||
      !req.body.dollar ||
      !req.body.rupee ||
      !req.body.productKey
    )
      return res
        .status(200)
        .json({ status: false, message: 'Invalid Details!' });

    const coinPlan = new CoinPlan();

    coinPlan.diamonds = req.body.diamonds;
    coinPlan.dollar = req.body.dollar;
    coinPlan.rupee = req.body.rupee;
    coinPlan.tag = req.body.tag;
    coinPlan.productKey = req.body.productKey;

    await coinPlan.save();

    return res
      .status(200)
      .json({ status: true, message: 'Success!', coinPlan });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || 'Server Error' });
  }
};

// update coin plan
exports.update = async (req, res) => {
  try {
    const coinPlan = await CoinPlan.findById(req.params.planId);

    if (!coinPlan) {
      return res
        .status(200)
        .json({ status: false, message: 'Plan does not Exist!' });
    }

    coinPlan.diamonds = req.body.diamonds;
    coinPlan.dollar = req.body.dollar;
    coinPlan.rupee = req.body.rupee;
    coinPlan.tag = req.body.tag;
    coinPlan.productKey = req.body.productKey;

    await coinPlan.save();

    return res
      .status(200)
      .json({ status: true, message: 'Success!', coinPlan });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || 'Server Error' });
  }
};

// delete coinPlan
exports.destroy = async (req, res) => {
  try {
    const coinPlan = await CoinPlan.findById(req.params.planId);

    if (!coinPlan)
      return res
        .status(200)
        .json({ status: false, message: 'Plan does not Exist!' });

    coinPlan.isDelete = true;

    await coinPlan.save();

    return res.status(200).json({ status: true, message: 'Success!' });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || 'Server Error' });
  }
};

exports.isTopToggle = async (req, res, next) => {
  try {
    const coinPlan = await CoinPlan.findById(req.query.planId);

    if (!coinPlan) {
      return res
        .status(200)
        .json({ status: false, message: 'CoinPlan not found' });
    }
    coinPlan.isTop = !coinPlan.isTop;

    const topPlan = await CoinPlan.find({
      isTop: true,
      _id: { $ne: coinPlan._id },
    });
    if (topPlan.length > 0 && coinPlan.isTop) {
      return res.status(200).json({
        status: false,
        message: 'overflow ! only one coinPlan allowed in Top coinPlan.',
      });
    }
    await coinPlan.save();

    return res
      .status(200)
      .json({ status: true, message: 'success', data: coinPlan });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || 'server error' });
  }
};

//pay stripe api for android
exports.createCustomer = async (req, res) => {
  try {
    console.log('createCustomer api call : ', req.body);

    if (!req.body.userId || !req.body.planId || !req.body.currency) {
      return res
        .status(200)
        .json({ status: false, message: 'Oops ! Invalid details!' });
    }
    const user = await User.findById(req.body.userId);
    if (!user) {
      return res
        .status(200)
        .json({ status: false, message: 'User does not Exists !' });
    }
    function isValidEmail(email) {
      var pattern = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/;
      return pattern.test(email);
    }

    let plan;
    if (!req.body.isVip) {
      plan = await CoinPlan.findById(req.body.planId);
    } else {
      plan = await VIPPlan.findById(req.body.planId);
    }
    if (!plan) {
      return res
        .status(200)
        .json({ status: false, message: 'Plan does not Exists !' });
    }
    const setting = await Setting.findOne();
    if (!setting) {
      return res
        .status(200)
        .json({ status: false, message: 'Setting does not Exists !' });
    }
    let email = user?.email;
    let name = user?.name;
    if (!email || !isValidEmail(email)) {
      console.log('innner');
      let fakeEmail = await FakeEmail.aggregate([{ $sample: { size: 1 } }]);
      email = fakeEmail[0]?.email;
    }
    if (!name) {
      let fakeUser = await FakeUser.aggregate([{ $sample: { size: 3 } }]);
      email = fakeUser[0]?.name;
    }

    const stripe = require('stripe')(setting?.stripeSecretKey);
    const customer = await stripe.customers.create({
      email: email,
      name: name,
    });
    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' }
    );
    const paymentIntent = await stripe.paymentIntents.create({
      amount:
        req.body.currency === 'inr' ? plan?.rupee * 100 : plan?.dollar * 100,
      currency: req.body.currency,
      customer: customer.id,
      // payment_method_types: [
      //   "card"
      // ],
      automatic_payment_methods: {
        enabled: true,
      },
    });
    console.log('...........paymentIntent ', paymentIntent);
    return res.status(200).json({
      status: true,
      paymentIntent: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: setting?.stripePublishableKey,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || 'Internal Server Error' });
  }
};

exports.payStripe = async (req, res) => {
  try {
    console.log(req.body, 'req.body. in stripe');
    if (req.body.userId && req.body.planId) {
      const user = await User.findById(req.body.userId).populate('level');
      if (!user) {
        return res.send({
          status: false,
          message: 'User does not exist!!',
          user: {},
        });
      }

      const plan = await CoinPlan.findById(req.body.planId);
      if (!plan) {
        return res.send({
          status: false,
          message: 'Plan does not exist!!',
          user: {},
        });
      }
      // const setting = await Setting.findOne({});
      // const stripe = require('stripe')(setting ? setting.stripeSecretKey : '');

      // let intent;
      // if (req.body.payment_method_id) {
      //   // Create the PaymentIntent
      //   intent = await stripe.paymentIntents.create({
      //     payment_method: req.body.payment_method_id,
      //     amount:
      //       req.body.currency === 'inr' ? plan.rupee * 100 : plan.dollar * 100,
      //     currency: req.body.currency,
      //     confirmation_method: 'manual',
      //     confirm: true,
      //   });
      // } else if (req.body.payment_intent_id) {
      //   intent = await stripe.paymentIntents.retrieve(
      //     req.body.payment_intent_id
      //   );
      //   if (intent.status === 'succeeded') {
      //     console.log(
      //       'intent has already been confirmed ======================= '
      //     );
      //   } else {
      //     console.log('intent IN confirm ======================= ');
      //     intent = await stripe.paymentIntents.confirm(
      //       req.body.payment_intent_id
      //     );
      //   }
      // }

      // // Send the response to the client
      // if (
      //   intent !== undefined &&
      //   intent.status === 'requires_action' &&
      //   intent.next_action.type === 'use_stripe_sdk'
      // ) {
      //   // Tell the client to handle the action
      //   return res.send({
      //     status: true,
      //     requires_action: true,
      //     payment_intent_client_secret: intent.client_secret,
      //   });
      // } else if (intent !== undefined && intent.status === 'succeeded') {
      // The payment didn’t need any additional actions and completed!
      // Handle post-payment fulfillment
      user.diamond += plan.diamonds;
      await user.save();

      const income = new Wallet();
      income.userId = user._id;
      income.diamond = plan.diamonds;
      income.planId = plan._id;
      income.type = 2;
      income.paymentGateway = 'Stripe';
      income.date = new Date().toLocaleString('en-US', {
        timeZone: 'Asia/Kolkata',
      });

      await income.save();

      return res.send({
        status: true,
        message: 'Success!!',
        user,
      });
      // } else {
      //   // Invalid status
      //   return res.send({
      //     status: false,
      //     message: 'Invalid PaymentIntent status',
      //     user: {},
      //   });
      // }
    } else {
      return res.send({
        status: false,
        message: 'Invalid Details!',
        user: {},
      });
    }
  } catch (e) {
    console.log(e);
    // Display error on client
    return res.send({ status: false, error: e.message, user: {} });
  }
};

//add plan through google play
exports.payGooglePlay = async (req, res) => {
  try {
    if (
      // !req.body.packageName &&
      // !req.body.token &&
      // !req.body.productId &&
      !req.body.userId &&
      !req.body.planId
    )
      return res
        .status(200)
        .json({ status: false, message: 'Invalid Details!' });

    const user = await User.findById(req.body.userId).populate('level');

    if (!user) {
      return res
        .status(200)
        .json({ status: false, message: 'User does not Exist!', user: {} });
    }

    const plan = await CoinPlan.findById(req.body.planId);
    if (!plan) {
      return res
        .status(200)
        .json({ status: false, message: 'Plan does not Exist!', user: {} });
    }

    // const setting = await Setting.findOne({});

    // const options = {
    //   email: setting.googlePlayEmail,
    //   key: setting.googlePlayKey,
    // };

    // const verifier = new Verifier(options);

    // var packageName = req.body.packageName;
    // var token = req.body.token;
    // var productId = req.body.productId;
    // let receipt = {
    //   packageName,
    //   productId, // sku = productId subscription id
    //   purchaseToken: token,
    // };

    // let promiseData = await verifier.verifyINAPP(receipt);

    // if (promiseData.isSuccessful) {
    user.diamond += plan.diamonds;
    await user.save();

    const income = new Wallet();
    income.userId = user._id;
    income.diamond = plan.diamonds;
    income.type = 2;
    income.planId = plan._id;
    income.paymentGateway = 'Google Play';
    income.date = new Date().toLocaleString('en-US', {
      timeZone: 'Asia/Kolkata',
    });

    await income.save();

    return res.status(200).json({ status: true, message: 'success', user });
    // } else {
    //   return res
    //     .status(200)
    //     .json({ status: false, message: promiseData.errorMessage, user: {} });
    // }
  } catch (error) {
    console.log(error);
    return res.status(200).json({
      status: false,
      message: error.errorMessage || 'Server Error',
      user: '',
    });
  }
};

// get purchase plan history of user
exports.purchaseHistory = async (req, res) => {
  try {
    let matchQuery = { type: 2 };
    if (req.query.userId) {
      const user = await User.findById(req.query.userId);

      if (!user)
        return res
          .status(200)
          .json({ status: false, message: 'User does not Exist!!' });

      matchQuery = { type: 2, userId: user._id };
    }

    const start = req.query.start ? parseInt(req.query.start) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;

    const addFieldQuery = {
      shortDate: {
        $toDate: { $arrayElemAt: [{ $split: ['$date', ', '] }, 0] },
      },
    };

    let dateFilterQuery = {};

    if (req.query.startDate !== 'ALL' && req.query.endDate !== 'ALL') {
      dateFilterQuery = {
        shortDate: {
          $gte: new Date(req.query.startDate),
          $lte: new Date(req.query.endDate),
        },
      };
    }

    const history = await Wallet.aggregate([
      {
        $match: matchQuery,
      },

      {
        $addFields: addFieldQuery,
      },
      {
        $match: dateFilterQuery,
      },
      { $sort: { _id: -1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $lookup: {
          from: 'coinplans',
          localField: 'planId',
          foreignField: '_id',
          as: 'plan',
        },
      },
      {
        $unwind: {
          path: '$plan',
          preserveNullAndEmptyArrays: false,
        },
      },
      {
        $project: {
          paymentGateway: 1,
          diamond: 1,
          name: '$user.name',
          dollar: '$plan.dollar',
          rupee: '$plan.rupee',
          purchaseDate: '$date',
        },
      },
      {
        $facet: {
          history: [
            { $skip: (start - 1) * limit }, // how many records you want to skip
            { $limit: limit },
          ],
          pageInfo: [
            { $group: { _id: null, totalRecord: { $sum: 1 } } }, // get total records count
          ],
        },
      },
    ]);

    return res.status(200).json({
      status: true,
      message: 'Success!!',
      total:
        history[0].pageInfo.length > 0 ? history[0].pageInfo[0].totalRecord : 0,
      history: history[0].history,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ status: false, error: error.message || 'Server Error' });
  }
};
