const socket = new WebSocket("ws://localhost:3000");
let peer = new RTCPeerConnection();

socket.onmessage = async (event) => {

    const message = JSON.parse(event.data);

    if (message.type === "offer") {
        await peer.setRemoteDescription(message.payload);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        peer.onicecandidate = (event) => {

            if (!event.candidate) return;

            socket.send(JSON.stringify({

                type: "ice-candidate",

                room: "abc123",

                payload: event.candidate

            }));
        }
        socket.send(JSON.stringify({
            type: "answer",
            room: "abc123",
            payload: answer

        }));

    }

}