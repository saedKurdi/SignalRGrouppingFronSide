let CURRENT_ROOM = "";
let totalSeconds = 10;
let currentUser = "";

let room = document.querySelector("#room");

let info = document.querySelector("#info");

let offerValue = document.querySelector("#offerValue");
let offerValue2 = document.querySelector("#offerValue2");
let offerValue3 = document.querySelector("#offerValue3");

let timerContainer = document.querySelector("#timer-container");
let timer = document.querySelector("#timer");

let offerBtn = document.querySelector("#offerBtn");

let btnContainer = document.querySelector("#btnContainer");
let exitBtn = document.querySelector("#exitBtn");

const url = "https://localhost:7182/";

let interval;

// creating connection to signalR in ASP side :
const connection = new signalR.HubConnectionBuilder()
  .withUrl(url + "offers")
  .configureLogging(signalR.LogLevel.Information)
  .build();

async function start() {
  if (connection.state === signalR.HubConnectionState.Disconnected) {
    try {
      await connection.start(); // connecting to the hub
      console.log("Connected successfully!");
    } catch (error) {
      console.log("Connection failed. Retrying in 5 seconds...", error);
      setTimeout(start, 5000); // reconnect after 5 seconds
    }
  } else {
    console.log("Connection is already in progress or established.");
  }
}

// functions that subscribed in js side :
connection.on("ReceiveJoinInfo", (username) => {
  info.textContent = `user - ${username} has joined to ${CURRENT_ROOM} room .`;
  info.style.color = "springgreen";
});

connection.on("ReceiveExitInfo", (username) => {
  info.textContent = `user - ${username} has disconnected from ${CURRENT_ROOM} room .`;
  info.style.color = "red";
});

connection.on("ReceiveInfoRoom", (user, price) => {
  offerValue2.textContent = user + " increased price to $" + price;
  offerValue2.style.color = "springgreen";
});

connection.on("ReceiveWinInfoRoom", (message, currentPrice) => {
  offerValue3.textContent = message + " with price : $" + currentPrice;
});

connection.on("ReceiveInitialPrice", (initPrice) => {
  offerValue.textContent =
    "Initial price : $" + initPrice + `(${CURRENT_ROOM})`;
});

async function joinRoom(roomName) {
  currentUser = document.querySelector("#user").value;
  CURRENT_ROOM = roomName;

  if (currentUser.trim() == "") return;

  await start();
  await connection.invoke("JoinRoom", CURRENT_ROOM, currentUser);
  await connection.invoke("SendInitialPrice", CURRENT_ROOM);

  $("#user").hide();
  btnContainer.style.display = "none";
  exitBtn.style.display = "block";
  offerBtn.style.display = "block";
}

async function exitRoom() {
  timerContainer.style.display = "none";
  await connection.invoke("ExitRoom", CURRENT_ROOM, currentUser);
  $("#user").show();
  btnContainer.style.display = "block";
  exitBtn.style.display = "none";
}

async function increaseOffer() {
  timerContainer.style.display = "block";
  // sending message to others that this user increased offer of special car :
  clearInterval(interval);
  totalSeconds = 10;

  $.get(url + `api/Offer/IncreaseRoom?room=${CURRENT_ROOM}&data=100`);
  await connection.invoke("SendMessageRoom", CURRENT_ROOM, currentUser);
  offerBtn.disabled = true;
  interval = setInterval(async () => {
    if (totalSeconds === 0) {
      clearInterval(interval);
      totalSeconds = 10;
      offerBtn.disabled = false;
      await connection.invoke(
        "SendWinnerMessageRoom",
        CURRENT_ROOM,
        currentUser + " has won !"
      );
      timerContainer.start.display = "none";
    }
    totalSeconds -= 1;
    timer.textContent = totalSeconds;
  }, 1000);
}
