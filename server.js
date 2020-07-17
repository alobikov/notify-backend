/*
Что должен уметь сервер?
У сервера два API. 
Первый - websockets, для работы с мобильными клиентами.
  Платформа Socket.io;
  Авторизация клиента по шаблону имени и возможно по сетке.
    Используемые методы:
      connection
      disconnect
      send-message (custom) входящий, сообщение от мобильного клиета
      message (custom) исходящий, сообщение для мобильного клиента
      new-user (custom) входящий, регистрация нового клиента 
Второй интерфейс - для связи с CRM Dynamics.
  Платформа Express.js;
  Авторизация клиента по IP адресу.
  Методы: 
    GET - запросить список адресатов.
    POST - послать сообщение.
Mongodb используется для хранения сообщений.
Требования:
Integrity - функция трансляции сообщения, полученного по API, клиенту 
socketio должна работать даже при отсуствии db. 
*/

const createMock = require("./utils/createMock"),
  db = require("./utils/mongo"),
  Message = require("./models/Message"), // db record schema
  mongoose = require("mongoose"),
  chalk = require("chalk"),
  path = require("path"),
  express = require("express"),
  // app = express(),
  portExpress = process.env.IP_WEBSITE_PORT || 3002,
  portWs = process.env.IP_SOCKETIO_PORT || 3000,
  url = process.env.DB_IP_ADDRESS || "localhost", // use mongo here if docker-compose deployment
  mongodbUrl = `mongodb://${url}/notify`,
  webUserNames = ["Web-Brat", "Web-Dog", "Web-Guy", "Web-Dev"];
console.log({ url });
// this is storage for socketio subscribers
// it is being hold only in RAM as user dynamiclly
// reconnects to socketio;
// holds {socket.id : user} pairs
const users = {};

const app = require("express")(),
  http = require("http").createServer(app),
  io = require("socket.io")(http);

app.use(express.static(path.join(__dirname, "public")));

io.on("connection", (socket) => {
  console.log("A user connected to socket.io");
});

http.listen(portWs, () => {
  console.log("Express listening on port:", portWs);
});

async function start() {
  // because of Integrity req. Express starts first!
  runExpress();
  // next try to attach Mongo
  try {
    await mongoose.connect(mongodbUrl, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });
    console.log("Mongo db connected on", mongodbUrl);
    mongoose.connection.on("error", (error) =>
      console.log("Connection with db lost, tryinbg to reconnect...")
    );
    // createMock();
  } catch (e) {
    console.log(`Mongo db connection error: ${mongodbUrl}:`, e);
  }
}
//? =========================== RUN EXPRESS =================================
function runExpress() {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "*");
    next();
  });

  app.use(express.json());
  // app.use(express.static(path.join(__dirname, "public")));
  // app.use(express.static(__dirname));

  //**************************** API GET ROOT/WELCOME **************************/
  // This is welcome message of API
  app.get("/", function (req, res) {
    console.log('GET on "/" recieved');
    res.sendFile(__dirname + "/index.html");
    // res.send(`<h2>API for CRM</h2>`);
  });
  //**************************** API GET MESSAGES ******************************/
  app.get("/messages", async function (req, res) {
    console.log('GET on "/messages" recieved');
    res.json(await db.getAllMessages());
  });
  //**************************** API GET MESSAGES ******************************/
  app.get("/messages/delete", async function (req, res) {
    console.log('GET on "/messages/delete" recieved');
    mongoose.connection.db.dropCollection("messages", function (err, result) {
      console.log("done");
      res.send("All records deleted");
    });
  });
  //**************************** API GET USERS *********************************/
  app.get("/users", function (req, res) {
    console.log('GET on "/users" received');
    const usersJson = Object.keys(users).map((key) => {
      return { socketId: key, deviceId: users[key] };
    });
    console.log(usersJson[0]);
    if (typeof usersJson[0] === "undefined") {
      git;
      res.send(`<h2>There is no registred users yet.</h2>`);
    } else {
      res.json(usersJson);
    }
  });
  //**************************** API GET USERS AND ID **************************/
  app.get("/users_id", function (req, res) {
    console.log('GET on "/users_id" received');
    // alternative way to send json from express
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify({ users }));
  });
  //**************************** API POST MESSAGE ******************************/
  // This service used by CRM and webclient to send target message to
  // mobile terminal
  app.post("/message", (req, res) => {
    console.log('POST to "/messages" received');
    res.send({ response: "Message received" });

    const { message, to, from } = req.body;
    const timestamp = Date.now();

    console.log(
      message.trim() +
        " | sent to " +
        to +
        " | on " +
        Date(timestamp).toString().slice(0, 24)
    );
    // save message in mongo
    const msgToDb = new Message({
      message: message,
      to: to,
      confirmed: false,
      from: from && "CRM",
      timestamp: Date.now(),
    });
    msgToDb.save();

    // check presence of addressee in users
    // emit message if addresse exists
    const targetSocket = Object.keys(users).filter((key) => {
      console.log(users[key], to);
      return users[key] === to;
    })[0];
    console.log({ targetSocket });
    if (targetSocket) {
      console.log("emitting personally");
      io.to(targetSocket).emit("message", {
        message: message,
        timestamp: timestamp,
        to: to,
        from: from,
      });
    }
  });

  // app.listen(portExpress, () =>
  //   console.log("Expess listening on port ", portExpress)
  // );
}
//? =========================================================================

// const io = require("socket.io")(portWs);

//****************************************************************************/
// Main event loop of Socket.io
// receives custome method 'send-message' from user and relay emits
// 'message' to users
// This is supplementary service which allows mobile users to send messages
io.on("connection", (socket) => {
  console.log("New user connected", socket.id, new Date());
  /// advice username to connected client
  const name = webUserNames.pop() || "Web-Dev";
  socket.emit("your-name", name);
  users[socket.id] = name; // save value pair in users

  socket.on("send-message", (data) => {
    console.log(data);
    socket.broadcast.emit("message", {
      message: data.message,
      from: data.from,
      to: data.to,
    });
  });

  socket.on("new-user", (name) => {
    users[socket.id] = name; // save value pair in users
    console.log("New user registred %s", users);
  });
  socket.on("disconnect", () => {
    const name = users[socket.id];
    // socket.broadcast.emit("user-disconnected", users[socket.id]);
    console.log(`${name} socket disconnected!`);
    delete users[socket.id]; // clean up local storage
    webUserNames.push(name); // return name to the pool
  });
});

start();
