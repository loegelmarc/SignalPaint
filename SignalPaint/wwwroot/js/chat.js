﻿"use strict";

//Query ui elements
const $force = document.querySelectorAll("#force")[0];
const $touches = document.querySelectorAll("#touches")[0];
const canvas = document.querySelectorAll("canvas")[0];
const context = canvas.getContext("2d");

const color_picker = document.getElementById("color-picker");
const color_picker_wrapper = document.getElementById("color-picker-wrapper");
const $clear = document.getElementById("clearScreen");

//const $send = document.querySelectorAll("#sendButton")[0];
//const $user = document.querySelectorAll("#userInput")[0];
//const $message = document.querySelectorAll("#messageInput")[0];
//const $messages = document.querySelectorAll("#messagesList")[0];
const $colors = document.querySelectorAll(".selectColor");
console.log($colors);

//Define variables
let lineWidth = 0;
let isMousedown = false;
let clients = {};
console.log(clients);
//let points = [];
//let strokeStyle = "black";
let localStrokeStyle = "black";

//Setup
canvas.width = window.innerWidth * 2;
canvas.height = window.innerHeight * 2;

const requestIdleCallback = window.requestIdleCallback || function (fn) { setTimeout(fn, 1) };

//Connect to hub
var connection = new signalR.HubConnectionBuilder().withUrl("/chatHub").withAutomaticReconnect().build();

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

function CreateClient() {
  return { 'points': [], 'strokeStyle': "" };
}
function OnSignalDisconnected(id) {
  console.log(id & " disconnected");
  clients[id] = null;
}
connection.on("SignalDisconnected", OnSignalDisconnected);

function OnSignalClearScreen(id) {
  console.log(id & " clears the screen");
  context.clearRect(0, 0, canvas.width, canvas.height);
}
connection.on("SignalClearScreen", OnSignalClearScreen);


//function OnSignalSetColor(id, newColor) {

//  if (!clients[id]) {
//    clients[id] = CreateClient();
//  }

//  clients[id].strokeStyle = newColor;
//  //alert(newColor);
//  if (color_picker.value !== newColor) {
//    color_picker.value = newColor;
//    color_picker_wrapper.style.backgroundColor = newColor;
//  }
//  //color_picker_wrapper.style.backgroundColor = color_picker.value;
//}
//connection.on("SignalSetColor", OnSignalSetColor);


function OnSignalTouchStart(id, x, y, lineWidth, color) {
  //isMousedown = true;
  console.log(id);
  if (!clients[id]) {
    clients[id] = CreateClient();
  }
  clients[id].strokeStyle = color;
  //lineWidth = Math.log(pressure + 1) * 40;
  //context.lineWidth = lineWidth; // pressure * 50;
  //context.strokeStyle = clients[id].strokeStyle;
  //context.lineCap = "round";
  //context.lineJoin = "round";
  //context.beginPath();
  //context.moveTo(x, y);

  const point = { x, y, lineWidth };
  clients[id].points.push(point);
  //points.push(point);
}
connection.on("SignalTouchStart", OnSignalTouchStart);

function OnSignalTouchMove(id, x, y, lineWidth) {
  if (!clients[id]) {
    console.log("Error");
  }
  const client = clients[id];
  const points = client.points;
  const point = { x, y, lineWidth };
  points.push(point);
  //points.push(point);

  //context.strokeStyle = client.strokeStyle;
  //context.lineCap = "round";
  //context.lineJoin = "round";
  // context.lineWidth   = lineWidth// pressure * 50;
  // context.lineTo(x, y);
  // context.moveTo(x, y);

  if (points.length >= 3) {
    const l = points.length - 1;
    context.beginPath();
    context.strokeStyle = client.strokeStyle;
    context.lineCap = "round";
    context.lineJoin = "round";
    //let xStart = 0;
    //let yStart = 0;
    if (points.length === 3) {
      const p0 = points[0];
      //context.moveTo(x, y);
      context.moveTo(p0.x, p0.y);
    } else {
      const xcStart = (points[l - 1].x + points[l - 2].x) / 2;
      const ycStart = (points[l - 1].y + points[l - 2].y) / 2;
      context.moveTo(xcStart, ycStart);
    }
    //const l = points.length - 1;
    const xc = (points[l].x + points[l - 1].x) / 2;
    const yc = (points[l].y + points[l - 1].y) / 2;
    context.lineWidth = points[l - 1].lineWidth;
    context.quadraticCurveTo(points[l - 1].x, points[l - 1].y, xc, yc);
    context.stroke();
    //context.beginPath();
    //context.moveTo(xc, yc);
  }
}
connection.on("SignalTouchMove", OnSignalTouchMove);

function OnSignalTouchEnd(id, x, y) {
  if (!clients[id]) {
    console.log("Error");
  }
  const client = clients[id];
  const points = client.points;
  //isMousedown = false;


  if (points.length >= 3) {
    const l = points.length - 1;
    const lastPoint = points[l];
    const xc = (points[l - 1].x + points[l - 2].x) / 2;
    const yc = (points[l - 1].y + points[l - 2].y) / 2;

    context.beginPath();
    context.moveTo(xc, yc);

    context.strokeStyle = client.strokeStyle;
    context.lineCap = "round";
    context.lineJoin = "round";

    context.lineWidth = points[l - 1].lineWidth;
    context.quadraticCurveTo(lastPoint.x, lastPoint.y, x, y);
    context.stroke();
  }

  client.points = [];
  //points = [];
  lineWidth = 0;
}
connection.on("SignalTouchEnd", OnSignalTouchEnd);


connection.start().then(function () {
  //$send.disabled = false;
}).catch(function (err) {
  return console.error(err.toString());
});

//$send.addEventListener("click", function (event) {
//  var user = $user.value;
//  var message = $message.value;
//  connection.invoke("SendMessage", user, message).catch(function (err) {
//    return console.error(err.toString());
//  });
//  event.preventDefault();
//});

$clear.addEventListener("click", function (event) {
  connection.invoke("SignalClearScreen").catch(function (err) {
    return console.error(err.toString());
  });
  event.preventDefault();
});


function OnTouchStart(e) {
  console.log(e);
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

  lineWidth = Math.log(pressure + 1) * 40;

  isMousedown = true;

  connection.invoke("SignalTouchStart", x, y, lineWidth, localStrokeStyle).catch(function (err) {
    return console.error(err.toString());
  });

  //lineWidth = Math.log(pressure + 1) * 40;
  //context.lineWidth = lineWidth; // pressure * 50;
  //context.strokeStyle = "black";
  //context.lineCap = "round";
  //context.lineJoin = "round";
  //context.beginPath();
  //context.moveTo(x, y);

  //points.push({ x, y, lineWidth });
}

function OnTouchMove(e) {
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

  connection.invoke("SignalTouchMove", x, y, lineWidth).catch(function (err) {
    return console.error(err.toString());
  });
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

  requestIdleCallback(() => {
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

function OnTouchEnd(e) {
  //let pressure = 0.1;
  let x, y;

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

  connection.invoke("SignalTouchEnd", x, y).catch(function (err) {
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

color_picker.onchange = function () {
  localStrokeStyle = color_picker.value;
  color_picker_wrapper.style.backgroundColor = localStrokeStyle;
  //connection.invoke("SignalSetColor", color_picker.value).catch(function (err) {
  //  console.log(err);
  //  return console.error(err.toString());
  //});
}
color_picker_wrapper.style.backgroundColor = color_picker.value;


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

//Add event listeners
for (const ev of ["touchstart", "mousedown"]) {
  canvas.addEventListener(ev, OnTouchStart);
}

for (const ev of ["touchmove", "mousemove"]) {
  canvas.addEventListener(ev, OnTouchMove);
}

for (const ev of ["touchend", "touchleave", "mouseup"]) {
  canvas.addEventListener(ev, OnTouchEnd);
};