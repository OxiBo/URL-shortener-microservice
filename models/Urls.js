const mongoose = require("mongoose");
const { Schema } = mongoose;

const urlSchema = new Schema({
  name: String,
  shortened: Number
});

module.exports = mongoose.model("urls", urlSchema);
