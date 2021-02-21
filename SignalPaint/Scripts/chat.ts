"use strict";
// ReSharper disable All 

declare const signalR: any;

interface Position {
  x: number;
  y: number;
}

interface Point extends Position {
  lineWidth: number;
}

interface Client {
  points: Point[];
  strokeStyle: string;
}


//Query ui elements
const $force = document.querySelectorAll("#force")[0];
const $touches = document.querySelectorAll("#touches")[0];
const canvas = document.querySelectorAll("canvas")[0];
const context = canvas.getContext("2d");

const colorPicker = document.getElementById("color-picker") as HTMLInputElement;
const colorPickerWrapper = document.getElementById("color-picker-wrapper");
const $clear = document.getElementById("clearScreen");

const invite = document.querySelector("#inviteButton");
const save = document.querySelector("#saveButton");

//const $send = document.querySelectorAll("#sendButton")[0];
//const $user = document.querySelectorAll("#userInput")[0];
//const $message = document.querySelectorAll("#messageInput")[0];
//const $messages = document.querySelectorAll("#messagesList")[0];
const $colors = document.querySelectorAll(".selectColor");
console.log($colors);

//Define variables
let roomId: string;
let lineWidth = 0;
let isMousedown = false;
const clients: { [id: string]: Client } = {};
console.log(clients);
let localStrokeStyle = "black";

//Setup
canvas.width = window.innerWidth * 2;
canvas.height = window.innerHeight * 2;

const requestIdleCallback2 = (window as Window).requestIdleCallback || (fn => { setTimeout(fn, 1) });

//Connect to hub
const connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").withAutomaticReconnect().build();

//Disable send button until connection is established
//$send.disabled = true;

//function OnReceiveMessage(user, message) {
//  const msg = message.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
//  const encodedMsg = user + " says " + msg;
//  const li = document.createElement("li");
//  li.textContent = encodedMsg;
//  $messages.appendChild(li);
//}
//connection.on("ReceiveMessage", OnReceiveMessage);

function connectToRoom() {
  //const url = new URL(window.location.href);
  const queryString = window.location.search;
  //const queryString = url.search;
  //console.log(queryString);
  const urlParams = new URLSearchParams(queryString);
  const room = urlParams.get("room");
  console.log(`Room from url: ${room}`);
  if (room) {
    console.log("Join room.");
    connection.invoke("SignalJoinRoom", room).catch(err => console.error(err.toString()));
  } else {
    console.log("Create new room.");
    connection.invoke("SignalCreateNewRoom").catch(err => console.error(err.toString()));
  }

}

function createClient(): Client {
  return { points: [], strokeStyle: "" };
}

function getPointBetween(p1: Position, p2: Position): Position {
  const x = (p1.x + p2.x) / 2;
  const y = (p1.y + p2.y) / 2;
  return { x, y };
}

function onSignalJoinedRoom(id: string) {
  roomId = id;
  const url = new URL(window.location.href);
  const urlParams = new URLSearchParams(url.search);
  urlParams.set("room", roomId);
  url.search = urlParams.toString();
  window.history.pushState("Data", "", url.toString());
  console.log(`Joined room: ${roomId}`);
  console.log(`URL is now: ${url}`);
  //document.location.hash = "?room=" & id;
}
connection.on("SignalJoinedRoom", onSignalJoinedRoom);


function onSignalDisconnected(id: string) {
  console.log(id + " disconnected");
  clients[id] = null;
}
connection.on("SignalDisconnected", onSignalDisconnected);

function onSignalClearScreen(id: string) {
  console.log(id + " clears the screen");
  context.clearRect(0, 0, canvas.width, canvas.height);
}
connection.on("SignalClearScreen", onSignalClearScreen);

function onSignalTouchStart(id: string, x: number, y: number, lineWidth: number, color: string) {
  //console.log(id);
  if (!clients[id]) {
    clients[id] = createClient();
  }
  clients[id].strokeStyle = color;
  const point: Point = { x, y, lineWidth };
  clients[id].points.push(point);
}
connection.on("SignalTouchStart", onSignalTouchStart);

function onSignalTouchMove(id: string, x: number, y: number, lineWidth: number) {
  if (!clients[id]) {
    console.log("Error");
  }
  const client = clients[id];
  const points = client.points;
  const point: Point = { x, y, lineWidth };
  points.push(point);


  if (points.length >= 3) {
    const l = points.length - 1;
    context.beginPath();

    if (points.length === 3) {
      const p0 = points[0];
      context.moveTo(p0.x, p0.y);
    } else {
      const cStart = getPointBetween(points[l - 1], points[l - 2]);
      context.moveTo(cStart.x, cStart.y);
    }

    context.strokeStyle = client.strokeStyle;
    context.lineWidth = points[l - 1].lineWidth;
    context.lineCap = "round";
    context.lineJoin = "round";

    const c = getPointBetween(points[l], points[l - 1]);
    context.quadraticCurveTo(points[l - 1].x, points[l - 1].y, c.x, c.y);
    context.stroke();
  }
}
connection.on("SignalTouchMove", onSignalTouchMove);

function onSignalTouchEnd(id: string, x: number, y: number) {
  if (!clients[id]) {
    console.log("Error");
  }
  const client = clients[id];
  const points = client.points;


  if (points.length >= 3) {
    const l = points.length - 1;
    const lastPoint = points[l];
    const c = getPointBetween(lastPoint, points[l - 1]);

    context.beginPath();
    context.moveTo(c.x, c.y);

    context.strokeStyle = client.strokeStyle;
    context.lineWidth = points[l - 1].lineWidth;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.quadraticCurveTo(lastPoint.x, lastPoint.y, x, y);
    context.stroke();
  }

  client.points = [];
  lineWidth = 0;
}
connection.on("SignalTouchEnd", onSignalTouchEnd);


connection.start().then(() => {
  //$send.disabled = false;
  connectToRoom();
}).catch(err => console.error(err.toString()));

connection.onreconnected(() => {
  console.log("Reconnected");
  connectToRoom();
});

//$send.addEventListener("click", function (event) {
//  var user = $user.value;
//  var message = $message.value;
//  connection.invoke("SendMessage", user, message).catch(function (err) {
//    return console.error(err.toString());
//  });
//  event.preventDefault();
//});

$clear.addEventListener("click", event => {
  connection.invoke("SignalClearScreen").catch(err => console.error(err.toString()));
  event.preventDefault();
});


function onTouchStart(e) {
  //console.log(e);
  e.preventDefault();
  let pressure = 0.1;
  let x: number, y: number;
  if (e.touches && e.touches[0] && typeof e.touches[0]["force"] !== "undefined") {
    if (e.touches[0]["force"] > 0) {
      pressure = e.touches[0]["force"];
    }
    x = e.touches[0].pageX * 2;
    y = e.touches[0].pageY * 2;
  } else {
    pressure = 1.0;
    x = e.pageX * 2;
    y = e.pageY * 2;
  }

  lineWidth = Math.log(pressure + 1) * 40;

  isMousedown = true;

  connection.invoke("SignalTouchStart", x, y, lineWidth, localStrokeStyle).catch(err => console.error(err.toString()));

  //lineWidth = Math.log(pressure + 1) * 40;
  //context.lineWidth = lineWidth; // pressure * 50;
  //context.strokeStyle = "black";
  //context.lineCap = "round";
  //context.lineJoin = "round";
  //context.beginPath();
  //context.moveTo(x, y);

  //points.push({ x, y, lineWidth });
}

function onTouchMove(e) {
  if (!isMousedown) return;
  e.preventDefault();

  let pressure = 0.1;
  let x, y;
  if (e.touches && e.touches[0] && typeof e.touches[0]["force"] !== "undefined") {
    if (e.touches[0]["force"] > 0) {
      pressure = e.touches[0]["force"];
    }
    x = e.touches[0].pageX * 2;
    y = e.touches[0].pageY * 2;
  } else {
    pressure = 1.0;
    x = e.pageX * 2;
    y = e.pageY * 2;
  }

  // smoothen line width
  lineWidth = (Math.log(pressure + 1) * 40 * 0.2 + lineWidth * 0.8);

  connection.invoke("SignalTouchMove", x, y, lineWidth).catch(err => console.error(err.toString()));
  //points.push({ x, y, lineWidth });

  //context.strokeStyle = "black";
  //context.lineCap = "round";
  //context.lineJoin = "round";
  //// context.lineWidth   = lineWidth// pressure * 50;
  //// context.lineTo(x, y);
  //// context.moveTo(x, y);

  //if (points.length >= 3) {
  //  const l = points.length - 1;
  //  const xc = (points[l].x + points[l - 1].x) / 2;
  //  const yc = (points[l].y + points[l - 1].y) / 2;
  //  context.lineWidth = points[l - 1].lineWidth;
  //  context.quadraticCurveTo(points[l - 1].x, points[l - 1].y, xc, yc);
  //  context.stroke();
  //  context.beginPath();
  //  context.moveTo(xc, yc);
  //}

  requestIdleCallback2(() => {
    $force.textContent = `force = ${pressure}`;

    const touch = e.touches ? e.touches[0] : null;
    if (touch) {
      $touches.innerHTML = `
          touchType = ${touch.touchType} ${touch.touchType === "direct" ? "👆" : "✍️"} <br/>
          radiusX = ${touch.radiusX} <br/>
          radiusY = ${touch.radiusY} <br/>
          rotationAngle = ${touch.rotationAngle} <br/>
          altitudeAngle = ${touch.altitudeAngle} <br/>
          azimuthAngle = ${touch.azimuthAngle} <br/>
        `;

      // 'touchev = ' + (e.touches ? JSON.stringify(
      //   ['force', 'radiusX', 'radiusY', 'rotationAngle', 'altitudeAngle', 'azimuthAngle', 'touchType'].reduce((o, key) => {
      //     o[key] = e.touches[0][key]
      //     return o
      //   }, {})
      // , null, 2) : '')
    }
  });
}

function onTouchEnd(e) {
  //let pressure = 0.1;
  let x: number, y: number;

  if (e.touches && e.touches[0] && typeof e.touches[0]["force"] !== "undefined") {
    //if (e.touches[0]["force"] > 0) {
    //pressure = e.touches[0]["force"];
    //}
    x = e.touches[0].pageX * 2;
    y = e.touches[0].pageY * 2;
  } else {
    //pressure = 1.0;
    x = e.pageX * 2;
    y = e.pageY * 2;
  }
  if (isNaN(x) && e.changedTouches && e.changedTouches[0]) {
    x = e.changedTouches[0].pageX * 2;
    y = e.changedTouches[0].pageY * 2;
  }

  isMousedown = false;

  connection.invoke("SignalTouchEnd", x, y).catch(err => {
    console.log(err);
    return console.error(err.toString());
  });


  //context.strokeStyle = "black";
  //context.lineCap = "round";
  //context.lineJoin = "round";

  //if (points.length >= 3) {
  //  const l = points.length - 1;
  //  context.quadraticCurveTo(points[l].x, points[l].y, x, y);
  //  context.stroke();
  //}

  //points = [];
  //lineWidth = 0;
}

colorPicker.onchange = () => {
  localStrokeStyle = colorPicker.value;
  colorPickerWrapper.style.backgroundColor = localStrokeStyle;
  //connection.invoke("SignalSetColor", color_picker.value).catch(function (err) {
  //  console.log(err);
  //  return console.error(err.toString());
  //});
}
colorPickerWrapper.style.backgroundColor = colorPicker.value;


//for (const color of $colors) {
//  for (const ev of ["click", "touchstart"]) {
//    color.addEventListener(ev, function (event) {
//      const element = event.srcElement.style.backgroundColor;

//      connection.invoke("SignalSetColor", element).catch(function (err) {
//        console.log(err);
//        return console.error(err.toString());
//      });

//      //alert(element);
//      //console.log(event);
//      //strokeStyle = element;
//    });
//  }
//}

//ConnectToRoom();

//Add event listeners
for (const ev of ["touchstart", "mousedown"]) {
  canvas.addEventListener(ev, onTouchStart);
}

for (const ev of ["touchmove", "mousemove"]) {
  canvas.addEventListener(ev, onTouchMove);
}

for (const ev of ["touchend", "touchleave", "touchcancel", "mouseup"]) {
  canvas.addEventListener(ev, onTouchEnd);
};


function createImageFromCanvas() {
  const image = new Image();
  image.src = canvas.toDataURL("image/png");
  return image;
}

if (navigator.share) {
  invite.addEventListener("click",
    () => {
      const shareData: ShareData = {
        title: "SignalPaint",
        text: "Join my room to paint with me.",
        url: window.location.toString()
      };

      navigator.share(shareData)
        .then(() => console.log("Shared successfully"))
        .catch((error) => console.log("Error sharing", error));
    });
} else {
  invite.classList.add("hidden");
  //save.classList.add("hidden");
}

save.addEventListener("click",
  () => {
    const image = createImageFromCanvas();
    const anchor = document.createElement("a");

    console.log(anchor);
    anchor.setAttribute("href", image.src);
    anchor.setAttribute("download", "image.png");
    anchor.click();
    //const image = canvas.toDataURL;
    ////https://w3c.github.io/web-share/demos/share-files.html
    ////https://stackoverflow.com/questions/61250048/how-to-share-a-single-base64-url-image-via-the-web-share-api
    //const blob = fetch(image).blob();
    //const file = new File([blob], "SignalPaint.png", { type: blob.type });
    //const files = [file];
    //if (navigator.canShare && navigator.canShare({ files: files })) {
    //  const shareData = {
    //    files: files,
    //    title: "SignalPaint",
    //    text: "Join my room to paint with me."
    //  };
    //  navigator.share(shareData)
    //    .then(() => console.log("Shared successfully"))
    //    .catch((error) => console.log("Error sharing", error));
    //} else {
    //  console.log(`Your system doesn't support sharing files.`);
    //}
  });

// ReSharper restore All