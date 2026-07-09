const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;
const http = require("http");
const { Server } = require('socket.io');

const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

io.on('connection',(socket)=>{
    socket.on('offer',(data)=> socket.broadcast.emit('offer',data));
    socket.on('answer',(data)=>socket.broadcast.emit('answer',data));
    socket.on('ice-candidate',(data)=>socket.broadcast.emit('ice-candidate',data));

});
server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
