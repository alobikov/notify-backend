const Message = require("../models/Message");

async function createMock() {
  console.log("Creating mock Messages in MongoDb...");
  const message = new Message({
    message: "Test message",
    to: "EDA-EMUL",
    from: "Dora",
    timestamp: Date.now(),
  });
  const message1 = new Message({
    message: "Dora, Here is my response",
    from: "EDA-EMUL",
    to: "Dora",
    timestamp: Date.now(),
  });
  await message.save();
  await message1.save();
}
module.exports = createMock;
