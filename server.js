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
Второй интерфейс - для связи с NAV Dynamics.
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
  server_version = "1.2.0",
  MAX_LIMIT = 21,
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
  mongodbUrl = `mongodb://${url}/notify`;
console.log({ url });
// this is storage for socket.io subscribers
// it is being hold only in RAM as user dynamically
// reconnects to socket.io;
// holds {socket.id : user} pairs
const users = {};

const app = require("express")(),
  http = require("http").createServer(app),
  io = require("socket.io")(http);

app.use(express.static(path.join(__dirname, "public")));

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
      console.log("Connection with db lost, trying to reconnect...")
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
    console.log('GET on "/" received');
    res.sendFile(__dirname + "/index.html");
    // res.send(`<h2>API for NAV</h2>`);
  });

  //**************************** API GET MESSAGES ******************************/
  app.get("/messages", async function (req, res) {
    console.log('GET on "/messages" received');
    res.json(await db.getAllMessages());
  });

  //************************ API GET DELETE MESSAGES ***************************/
  app.get("/messages/delete", async function (req, res) {
    console.log('GET on "/messages/delete" received');
    mongoose.connection.db.dropCollection("messages", function (err, result) {
      console.log("done");
      res.send("All records deleted");
    });
  });

  //******************** API GET DELETE MESSAGE BY ID ***********************/
  app.get("/messages/deleteId/:id", async function (req, res) {
    console.log('GET on "/messages/deleteId" received', req.params.id);
    const result = await db.deleteMessageById(req.params.id);
    if (result != null && typeof result === "object") {
      res.send(`Successfully deleted ${JSON.stringify(result)}`);
    } else {
      res.send("failed");
    }
  });

  //**************************** API GET USER MESSAGES *************************/
  app.get("/messages/:userId", async function (req, res) {
    console.log(`GET request for messages for ${JSON.stringify(req.params)}`);
    res.json(await db.getAllUserMessages(req.params.userId));
  });

  //**************************** API GET USERS *********************************/
  app.get("/users", function (req, res) {
    console.log('app.get(): GET on "/users" received');
    const usersJson = Object.keys(users).map((key) => {
      return { socketId: key, deviceId: users[key] };
    });
    console.log("GET response:", usersJson);
    if (typeof usersJson[0] === "undefined") {
      res.send(`<h2>There is no registered users yet.</h2>`);
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

  //****************** handler for API POST MESSAGE **************************/
  // This service used by NAV and web client to send target message to
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
        "| sent from " +
        from +
        " | on " +
        Date(timestamp).toString().slice(0, 24)
    );
    // save message in mongo
    const msgToDb = new Message({
      message: message,
      to: to,
      confirmed: false,
      from: from || "NAV",
      timestamp: Date.now(),
    });
    msgToDb.save();

    // check presence of addressee in users
    // emit message if addressee exists
    const targetSocket = Object.keys(users).find((key) => users[key] === to);
    console.log(`Message recipient "${to}" found:`, { targetSocket });
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
  //   console.log("Express listening on port ", portExpress)
  // );
}
//? =========================================================================

// const io = require("socket.io")(portWs);

//****************************************************************************/
// Main event loop of Socket.io
// receives custom method 'send-message' from user and relay emits
// 'message' to users
// This is supplementary service which allows mobile users to send messages
io.on("connection", (socket) => {
  console.log(
    "New socket connected",
    socket.id,
    new Date().toLocaleTimeString()
  );

  socket.on("send-message", (data) => {
    console.log(data);
    socket.broadcast.emit("message", {
      message: data.message,
      from: data.from,
      to: data.to,
    });
  });

  socket.on("new-user", (regName) => {
    console.log("users.length", Object.keys(users).length);
    if (Object.keys(users).length < MAX_LIMIT) {
      users[socket.id] = regName; // save key/value pair in users
      console.log("New user registered %s", users);
      socket.emit("user-confirm", "confirmed");
      socket.broadcast.emit("update-users-list");
    } else {
      socket.emit("user-confirm", "maximum limit of users reached");
      console.log(
        "Received 'new-user' event. Registration rejected. Reason: max_limit "
      );
    }
  });

  socket.on("del-user", (regName) => {
    console.log("del-user request received from socketID", socket.id);
    delete users[socket.id]; // clean up local storage
    socket.broadcast.emit("update-users-list");
  });

  socket.on("disconnect", () => {
    // socket.broadcast.emit("user-disconnected", users[socket.id]);
    console.log(`${socket.id} socket disconnected!`);
    delete users[socket.id]; // clean up local storage
    socket.broadcast.emit("update-users-list");
  });
});

start();
