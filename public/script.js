const socket = io();
const selectContainer = document.getElementById("select-container");
const messageForm = document.getElementById("send-button");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const errorContainer = document.getElementById("error-message");
const usernameContainer = document.getElementById("username-container");

const urlApi = urlExpress + ":" + portExpress;

console.log("Socket.io", socket.io);

var username = webUsername; // assign the value from constants.js

/// on 'connection' server advicing username
/// Web client should follow this advice,
/// (while mobile terminal will overwrite adviced name)
socket.on("your-name", (name) => {
  usernameContainer.value = name;
  username = name;
<<<<<<< HEAD
  getUsers("/users").then((users) => createDropDown(users));
=======
  getUsers("/users").then((users) => {
      createDropDown(users);
>>>>>>> c5d8be5996b3bc8d88c421d3dc4f30692e4bcb85
});

socket.on("connect", () => {
  console.log("socket connected!");
});

socket.on("message", ({ message, from }) => {
  console.log({ message });
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

messageForm.addEventListener("click", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  const to = selectContainer.value;
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
