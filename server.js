const express = require("express");
const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");

const app = express();

const server = http.createServer(app);

app.use(express.static("public"));

const wss = new WebSocketServer({
    server
});

let phone = null;
let viewers = [];

wss.on("connection", (socket) => {

    console.log("New WebSocket connection");

    socket.on("message", (data, isBinary) => {

        if (!isBinary) {

            const message = data.toString();

            if (message === "PHONE") {

                phone = socket;

                console.log("Phone connected");

            }

            if (message === "VIEWER") {

                viewers.push(socket);

                console.log("Viewer connected");

            }

            return;
        }

        if (socket === phone) {

            viewers.forEach((viewer) => {

                if (viewer.readyState === WebSocket.OPEN) {

                    viewer.send(data, {
                        binary: true
                    });

                }

            });

        }

    });

    socket.on("close", () => {

        if (socket === phone) {

            phone = null;

            console.log("Phone disconnected");

        }

        viewers = viewers.filter(
            viewer => viewer !== socket
        );

    });

});

server.listen(3000, "0.0.0.0", () => {

    console.log("Server running on port 3000");

});