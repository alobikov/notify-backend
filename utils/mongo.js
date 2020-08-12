const Message = require("../models/Message");

/// Reads all messages from db
///
/// No input, output: flat json

function getAllMessagesMock() {
  return {
    message: "accept tyres",
    to: "EDA-EMUL",
    from: "Dora",
    timestamp: 13453457654,
  };
}

async function getAllMessages() {
  const messages = await Message.find({});
  return messages;
}

async function getAllUserMessages(user) {
  const messages = await Message.find({ to: user });
  return messages;
}

module.exports = { getAllMessages, getAllUserMessages };
