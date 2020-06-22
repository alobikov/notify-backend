const { Schema, model } = require("mongoose");

const schema = Schema({
  message: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  from: {
    type: String,
    default: "CRM",
  },
  timestamp: {
    type: Number,
    required: true,
  },
  confirmed: {
    type: Boolean,
    default: false,
  },
});

module.exports = model("Message", schema);
