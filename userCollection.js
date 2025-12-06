const mongoose = require('mongoose');

const fakeUserSchema = new mongoose.Schema({
  name: { type: String, default: null },
});

module.exports = mongoose.model('userCollection', fakeUserSchema);
