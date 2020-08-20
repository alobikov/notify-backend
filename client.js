// this is console app for testing socket.io-client
const username = "Console_User";

const io = require("socket.io-client"),
  socket = io.connect("http://localhost:3000"),
  chalk = require("chalk");

socket.on("message", (msg) => console.info(msg));

socket.on("your-name", (name) => {
  console.log("Name advised by server:", chalk.green(name));
});

socket.on("connect", () => {
  socket.emit("new-user", username);
  console.log("socket connected! ID:", chalk.green(socket.id));
});

socket.on("user-confirm", (response) => {
  console.log("Name registration:", response);
});
