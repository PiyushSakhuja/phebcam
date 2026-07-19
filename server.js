const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);

app.use(express.static("public"));

const wss = new WebSocket.Server({
    server
});

const rooms = {};

wss.on("connection", (socket) => {

    console.log("Client connected");

    socket.on("message", (data) => {

        const message = JSON.parse(data.toString());

        console.log("Received:", message.type);

        // JOIN
        if (message.type === "join") {

            const room = message.room;

            if (!rooms[room]) {
                rooms[room] = [];
            }

            socket.room = room;
            socket.role = message.payload.role;

            rooms[room].push(socket);

            console.log(
                `${socket.role} joined ${room}`
            );

            console.log(
                "Clients in room:",
                rooms[room].length
            );

            // When phone + viewer are present
            if (rooms[room].length === 2) {

                const phone = rooms[room].find(
                    client =>
                        client.role === "phone"
                );

                if (phone) {

                    phone.send(JSON.stringify({
                        type: "peer-joined"
                    }));

                }
            }

            return;
        }


        // FORWARD SIGNALING MESSAGES

        const room = rooms[message.room];

        if (!room) {
            return;
        }

        for (const client of room) {

            if (
                client !== socket &&
                client.readyState === WebSocket.OPEN
            ) {

                client.send(
                    JSON.stringify(message)
                );

            }

        }

    });

});

server.listen(3000, "0.0.0.0", () => {

    console.log(
        "Server running on port 3000"
    );

});