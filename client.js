const io = require("socket.io-client"),
  socket = io.connect("http://localhost:3000"),
  chalk = require("chalk");

socket.on("message", (msg) => console.info(msg));

socket.on("your-name", (name) => {
  console.log("Name adviced by server:", chalk.green(name));
});

socket.on("connect", () => {
  console.log("socket connected! ID:", chalk.green(socket.id));
});
