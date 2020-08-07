const urlExpress = "http://localhost";
const portExpress = 3000;
const version = "1.1.2";

const selectContainer = document.getElementById("select-container");
const messageForm = document.querySelector(".form-send");
const messageInput = document.getElementById("message-input");
const messageContainer = document.getElementById("message-container");
const errorContainer = document.getElementById("error-message");
const usernameContainer = document.getElementById("username-container");
const urlApi = urlExpress + ":" + portExpress;
var username;

const socket = initSocket();

function initSocket() {
  const socket = io("");
  console.log("Socket.io", socket);
  document.querySelector(".status").innerHTML = `
      <p>Status: Websocket connected, user not registered.</p>`;
  document.querySelector(".version").textContent = `version ${version}`;

  // binding socket events

  // ! this event is very important
  // ! it means server restarted. We need to redeclare our name (deviceID)
  socket.on("connect", () => {
    console.log("socket connected!");

    // if web client has been registered then re-register with the same name
    username && socket.emit("new-user", username);

    // built new users dropdown list after random delay
    new Promise((resolve) => setTimeout(resolve, Math.random() * 3000)).then(
      () => {
        getUsers("/users").then((users) => {
          createDropDown(users);
        });
      }
    );
  });

  socket.on("user-confirm", (response) => {
    if (response === "confirmed") {
      document.querySelector(".status").innerHTML = `
        <p>Status: Websocket connected. Registered as <strong>${username}</strong></p>`;
      document.querySelector(".status").style.color = "black";
      document.getElementById("send-button").removeAttribute("disabled");
    } else {
      document.querySelector(".status").innerHTML = `
      <p>Status: Websocket connected. Registration rejected: ${response}</p>`;
      document.querySelector(".status").style.color = "red";
    }
  });

  socket.on("message", ({ message, from }) => {
    console.log("Message received", { message });
    addMessage(`${from}: ${message}`);
  });

  //* notification about changes in users list
  socket.on("update-users-list", (data) => {
    console.log("event 'update-users-list received");
    getUsers("/users").then((users) => {
      createDropDown(users);
    });
  });

  //? currently not used
  socket.on("user-connected", (data) => {
    console.log(`${data} joined socket.io`);
  });

  //? currently not used
  socket.on("user-disconnected", (name) => {
    console.log(`${name} disconnected from socket.io :(`);
  });

  socket.on("disconnect", (name) => {
    console.log(`Socket connection lost!`);
    document.querySelector(".status").innerHTML = `
    <p>Status: Websocket connection lost!</p>`;
    document.querySelector(".status").style.color = "red";
    document.getElementById("send-button").setAttribute("disabled", "");
  });

  socket.on("send-message", (data) => {
    console.log("Send-message received:", data);
  });

  return socket;
}

//! binding control for Send Button

messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  const to = selectContainer.value;
  console.log({ username });
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
  // if (username) {
  //   socket.emit("del-user", username);
  // }
  username = e.target.username.value.trim();
  console.log({ username });
  socket.emit("new-user", username);
  getUsers("/users").then((users) => {
    createDropDown(users);
  });
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
  document.querySelectorAll(".addressee").forEach((item) => item.remove());
  let optionElement;
  users.forEach((user) => {
    optionElement = document.createElement("option");
    optionElement.classList.add("addressee");
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
