const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const os = require('node:os');
const qr = require("qrcode");
const app = express();
const server = http.createServer(app);

app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.post('/qrcode',(req,res)=>{
    const url = req.body.url;
    console.log("server",url);
    
    qr.toDataURL(url,(err,qrurl)=>{
        if(err) res.send("something went wrong");
        console.log("server :",qrurl);
        
        res.json({"qrurl":qrurl});
    })
})

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
    socket.on("close", () => {

        const room = socket.room;

        if (!room || !rooms[room]) {
            return;
        }

        rooms[room] = rooms[room].filter(
            client => client !== socket
        );

        console.log(
            `${socket.role} left ${room}`
        );

        console.log(
            "Clients remaining:",
            rooms[room].length
        );

        if (rooms[room].length === 0) {
            delete rooms[room];
        }

    });

});


app.get('/api/get-ip', (req, res) => {
    const data = os.networkInterfaces();
    const wifiData = data["Wi-Fi"];
    const ipv4Details = wifiData.find(item => item.family === 'IPv4');
    res.json({
        "ip" : ipv4Details.address
    });
});

server.listen(3000, "0.0.0.0", () => {

    console.log(
        "Server running on port 3000"
    );

});