// const socket = io("http://localhost:3000", { username: "Aleksej" });
const selectContainer = document.getElementById("select-container");
const messageForm = document.getElementById("send-button");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const errorContainer = document.getElementById("error-message");
const usernameContainer = document.getElementById("username-container");

const urlApi = urlExpress + ":" + portExpress;

console.log("Socket.io", socket.io);
console.log(navigator.userAgent.toLowerCase());

var username = webUsername; // assign the value from constants.js

/// on socketio 'connection' server advicing username
/// Web client shoul follow this advice
socket.on("your-name", (name) => {
  usernameContainer.value = name;
  username = name;
  getUsers(urlApi + "/users").then((users) => createDropDown(users));
});

socket.on("connect", () => {
  console.log("socket connected");
});

socket.on("message", ({ message, from }) => {
  console.log({ message });
  addMessage(`${from}: ${message}`);
});
socket.on("user-connected", (data) => {
  addMessage(`${data} connects to the chat!`);
});

socket.on("user-disconnected", (name) => {
  addMessage(`${name} disconnects from the chat :(`);
});

socket.on("send-message", (data) => {
  console.log(data);
});

messageForm.addEventListener("click", (e) => {
  console.log("send button clicked");
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
  console.log("continue send submit");
  // socket.emit("send-message", { body: message });
  let body = {
    message: message,
    to: to,
    from: username,
  };
  fetch(urlApi + "/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json;charset=utf-8",
    },
    body: JSON.stringify(body),
  }).then((res) => {
    res.json().then((json) => console.log(json));
  });

  messageInput.value = "";
});

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
/// input: array of strings
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
