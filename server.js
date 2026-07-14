const { log } = require("console");
const express = require("express");
const http = require("http");
const { Socket } = require("socket.io");
const WebSocket = require("ws");

const app = express();
app.use(express.json());
const server = http.createServer(app);

const wss = new WebSocket.Server({
    server
});
const rooms = {};

wss.on("connection", (socket) => {
    console.log("client connected");
    socket.on("message", (data) => {
        const message = JSON.parse(data);
        if (message.type === "join") {
            if (!rooms[message.room]) {
                rooms[message.room] = [];
            }
            rooms[message.room].push(socket);
            socket.room = message.room;
            socket.role = message.payload.role;
            if (rooms[message.room].length === 2) {

                const phone = rooms[message.room].find(
                    client => client.role === "phone"
                );

                if (phone) {

                    phone.send(JSON.stringify({
                        type: "peer-joined"
                    }));

                }

            }
        }
        else {
            for (const client of rooms[message.room]) {

                if (client !== socket) {

                    client.send(JSON.stringify(message));

                }

            }
        }
    })
});
