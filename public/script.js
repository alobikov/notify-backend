const urlExpress = "http://localhost";
const portExpress = 3000;


const selectContainer = document.getElementById("select-container");
const messageForm = document.querySelector(".form-send");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const errorContainer = document.getElementById("error-message");
const usernameContainer = document.getElementById("username-container");
const urlApi = urlExpress + ":" + portExpress;
var username;

function initSocket(deviceID) {
  /// on 'connection' server advicing username
  /// Web client should follow this advice,
  /// (while mobile terminal(bar code scanner) will ignore adviced name)
  const socket = io("");
  console.log("Socket.io", socket); //was socket.io

  // binding socket events

  socket.on("your-name", (name) => {
    console.log(`Server adviced name ${name} ignored!`)
    getUsers("/users").then((users) => {
      createDropDown(users);
    });
  });

  socket.on("connect", () => {
    console.log("socket connected!");
  });

  socket.on("user-confirmed", () => {
    document.querySelector('.status').innerText="Status: Websocket connected. Username registration confirmed"
    document.getElementById('send-button').removeAttribute('disabled');
  });

  socket.on("message", ({ message, from }) => {
    console.log("Message received", { message });
    addMessage(`${from}: ${message}`);
  });

  //? currently not used
  socket.on("user-connected", (data) => {
    console.log(`${data} joined socket.io`);
  });

  //? currently not used
  socket.on("user-disconnected", (name) => {
    console.log(`${name} disconnected from socket.io :(`);
  });

  socket.on("send-message", (data) => {
    console.log("Send-message received:", data);
  });

  // registring own username (aka DeviceID) at server
  socket.emit('new-user', deviceID);

}
//! binding control for Send Message

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  const to = selectContainer.value;
  console.log({username})
  if (selectContainer.selectedIndex === 0) {
    errorMessage("Error: Addressee is not selected");
    return;
  }
  if (!message) {
    errorMessage("Error: Message body can't be empty");
    return;
  }
  clearError();

  // POST the message
  let body = {
    message: message,
    to: to,
    from: username,
  };
  fetch("/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify(body),
  }).then((res) => {
    res.json().then((json) => console.log(json));
  });

  // clear message input field
  messageInput.value = "";
});

//! binding control for Register Button
document.querySelector(".form-username").addEventListener("submit", (e) => {
  e.preventDefault();
  username = e.target.username.value.trim();
  console.log({username});
  initSocket(username);
});

// append message at the bottom of message view area
function addMessage(message) {
  const messageElement = document.createElement("li");
  messageElement.innerText = message;
  messageContainer.appendChild(messageElement);
}

/// get users list from Mongodb via API
/// output: array of strings of user/deviceId names
async function getUsers(url) {
  try {
    const res = await fetch(url);
    const users = await res.json();
    return users.map((user) => {
      return user.deviceId;
    });
  } catch (e) {
    console.log("getUsers(): failed to fetch users from", url);
    return [];
  }
}

/// create view elements for dropdown user list
/// input: List<String>
function createDropDown(users) {
  let optionElement;
  users.forEach((user) => {
    optionElement = document.createElement("option");
    optionElement.textContent = user;
    optionElement.value = user;
    selectContainer.append(optionElement);
  });
}

function errorMessage(message) {
  errorContainer.textContent = message;
}

function clearError() {
  errorContainer.textContent = "";
}
