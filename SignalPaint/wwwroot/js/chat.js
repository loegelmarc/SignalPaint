"use strict";
//Query ui elements
var $force = document.querySelectorAll("#force")[0];
var $touches = document.querySelectorAll("#touches")[0];
var canvas = document.querySelectorAll("canvas")[0];
var context = canvas.getContext("2d");
var colorPicker = document.getElementById("color-picker");
var colorPickerWrapper = document.getElementById("color-picker-wrapper");
var $clear = document.getElementById("clearScreen");
var invite = document.querySelector("#inviteButton");
var save = document.querySelector("#saveButton");
//const $send = document.querySelectorAll("#sendButton")[0];
//const $user = document.querySelectorAll("#userInput")[0];
//const $message = document.querySelectorAll("#messageInput")[0];
//const $messages = document.querySelectorAll("#messagesList")[0];
var $colors = document.querySelectorAll(".selectColor");
console.log($colors);
//Define variables
var roomId;
var lineWidth = 0;
var isMousedown = false;
var clients = {};
console.log(clients);
var localStrokeStyle = "black";
//Setup
canvas.width = window.innerWidth * 2;
canvas.height = window.innerHeight * 2;
var requestIdleCallback2 = window.requestIdleCallback || (function (fn) { setTimeout(fn, 1); });
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
function connectToRoom() {
    //const url = new URL(window.location.href);
    var queryString = window.location.search;
    //const queryString = url.search;
    //console.log(queryString);
    var urlParams = new URLSearchParams(queryString);
    var room = urlParams.get("room");
    console.log("Room from url: " + room);
    if (room) {
        console.log("Join room.");
        connection.invoke("SignalJoinRoom", room).catch(function (err) { return console.error(err.toString()); });
    }
    else {
        console.log("Create new room.");
        connection.invoke("SignalCreateNewRoom").catch(function (err) { return console.error(err.toString()); });
    }
}
function createClient() {
    return { points: [], strokeStyle: "" };
}
function getPointBetween(p1, p2) {
    var x = (p1.x + p2.x) / 2;
    var y = (p1.y + p2.y) / 2;
    return { x: x, y: y };
}
function onSignalJoinedRoom(id) {
    roomId = id;
    var url = new URL(window.location.href);
    var urlParams = new URLSearchParams(url.search);
    urlParams.set("room", roomId);
    url.search = urlParams.toString();
    window.history.pushState("Data", "", url.toString());
    console.log("Joined room: " + roomId);
    console.log("URL is now: " + url);
    //document.location.hash = "?room=" & id;
}
connection.on("SignalJoinedRoom", onSignalJoinedRoom);
function onSignalDisconnected(id) {
    console.log(id + " disconnected");
    clients[id] = null;
}
connection.on("SignalDisconnected", onSignalDisconnected);
function onSignalClearScreen(id) {
    console.log(id + " clears the screen");
    context.clearRect(0, 0, canvas.width, canvas.height);
}
connection.on("SignalClearScreen", onSignalClearScreen);
function onSignalTouchStart(id, x, y, lineWidth, color) {
    //console.log(id);
    if (!clients[id]) {
        clients[id] = createClient();
    }
    clients[id].strokeStyle = color;
    var point = { x: x, y: y, lineWidth: lineWidth };
    clients[id].points.push(point);
}
connection.on("SignalTouchStart", onSignalTouchStart);
function onSignalTouchMove(id, x, y, lineWidth) {
    if (!clients[id]) {
        console.log("Error");
    }
    var client = clients[id];
    var points = client.points;
    var point = { x: x, y: y, lineWidth: lineWidth };
    points.push(point);
    if (points.length >= 3) {
        var l = points.length - 1;
        context.beginPath();
        if (points.length === 3) {
            var p0 = points[0];
            context.moveTo(p0.x, p0.y);
        }
        else {
            var cStart = getPointBetween(points[l - 1], points[l - 2]);
            context.moveTo(cStart.x, cStart.y);
        }
        context.strokeStyle = client.strokeStyle;
        context.lineWidth = points[l - 1].lineWidth;
        context.lineCap = "round";
        context.lineJoin = "round";
        var c = getPointBetween(points[l], points[l - 1]);
        context.quadraticCurveTo(points[l - 1].x, points[l - 1].y, c.x, c.y);
        context.stroke();
    }
}
connection.on("SignalTouchMove", onSignalTouchMove);
function onSignalTouchEnd(id, x, y) {
    if (!clients[id]) {
        console.log("Error");
    }
    var client = clients[id];
    var points = client.points;
    if (points.length >= 3) {
        var l = points.length - 1;
        var lastPoint = points[l];
        var c = getPointBetween(lastPoint, points[l - 1]);
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
connection.start().then(function () {
    //$send.disabled = false;
    connectToRoom();
}).catch(function (err) { return console.error(err.toString()); });
connection.onreconnected(function () {
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
$clear.addEventListener("click", function (event) {
    connection.invoke("SignalClearScreen").catch(function (err) { return console.error(err.toString()); });
    event.preventDefault();
});
function onTouchStart(e) {
    //console.log(e);
    e.preventDefault();
    var pressure = 0.1;
    var x, y;
    if (e.touches && e.touches[0] && typeof e.touches[0]["force"] !== "undefined") {
        if (e.touches[0]["force"] > 0) {
            pressure = e.touches[0]["force"];
        }
        x = e.touches[0].pageX * 2;
        y = e.touches[0].pageY * 2;
    }
    else {
        pressure = 1.0;
        x = e.pageX * 2;
        y = e.pageY * 2;
    }
    lineWidth = Math.log(pressure + 1) * 40;
    isMousedown = true;
    connection.invoke("SignalTouchStart", x, y, lineWidth, localStrokeStyle).catch(function (err) { return console.error(err.toString()); });
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
    if (!isMousedown)
        return;
    e.preventDefault();
    var pressure = 0.1;
    var x, y;
    if (e.touches && e.touches[0] && typeof e.touches[0]["force"] !== "undefined") {
        if (e.touches[0]["force"] > 0) {
            pressure = e.touches[0]["force"];
        }
        x = e.touches[0].pageX * 2;
        y = e.touches[0].pageY * 2;
    }
    else {
        pressure = 1.0;
        x = e.pageX * 2;
        y = e.pageY * 2;
    }
    // smoothen line width
    lineWidth = (Math.log(pressure + 1) * 40 * 0.2 + lineWidth * 0.8);
    connection.invoke("SignalTouchMove", x, y, lineWidth).catch(function (err) { return console.error(err.toString()); });
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
    requestIdleCallback2(function () {
        $force.textContent = "force = " + pressure;
        var touch = e.touches ? e.touches[0] : null;
        if (touch) {
            $touches.innerHTML = "\n          touchType = " + touch.touchType + " " + (touch.touchType === "direct" ? "👆" : "✍️") + " <br/>\n          radiusX = " + touch.radiusX + " <br/>\n          radiusY = " + touch.radiusY + " <br/>\n          rotationAngle = " + touch.rotationAngle + " <br/>\n          altitudeAngle = " + touch.altitudeAngle + " <br/>\n          azimuthAngle = " + touch.azimuthAngle + " <br/>\n        ";
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
    var x, y;
    if (e.touches && e.touches[0] && typeof e.touches[0]["force"] !== "undefined") {
        //if (e.touches[0]["force"] > 0) {
        //pressure = e.touches[0]["force"];
        //}
        x = e.touches[0].pageX * 2;
        y = e.touches[0].pageY * 2;
    }
    else {
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
colorPicker.onchange = function () {
    localStrokeStyle = colorPicker.value;
    colorPickerWrapper.style.backgroundColor = localStrokeStyle;
    //connection.invoke("SignalSetColor", color_picker.value).catch(function (err) {
    //  console.log(err);
    //  return console.error(err.toString());
    //});
};
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
for (var _i = 0, _a = ["touchstart", "mousedown"]; _i < _a.length; _i++) {
    var ev = _a[_i];
    canvas.addEventListener(ev, onTouchStart);
}
for (var _b = 0, _c = ["touchmove", "mousemove"]; _b < _c.length; _b++) {
    var ev = _c[_b];
    canvas.addEventListener(ev, onTouchMove);
}
for (var _d = 0, _e = ["touchend", "touchleave", "touchcancel", "mouseup"]; _d < _e.length; _d++) {
    var ev = _e[_d];
    canvas.addEventListener(ev, onTouchEnd);
}
;
function createImageFromCanvas() {
    var image = new Image();
    image.src = canvas.toDataURL("image/png");
    return image;
}
if (navigator.share) {
    invite.addEventListener("click", function () {
        var shareData = {
            title: "SignalPaint",
            text: "Join my room to paint with me.",
            url: window.location.toString()
        };
        navigator.share(shareData)
            .then(function () { return console.log("Shared successfully"); })
            .catch(function (error) { return console.log("Error sharing", error); });
    });
}
else {
    invite.classList.add("hidden");
    //save.classList.add("hidden");
}
save.addEventListener("click", function () {
    var image = createImageFromCanvas();
    var anchor = document.createElement("a");
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
//# sourceMappingURL=chat.js.map