const mongoose = require("mongoose");

const fakeEmailSchema = new mongoose.Schema({
  email: { type: String, default: null },
});

module.exports = mongoose.model("emailCollection", fakeEmailSchema);
