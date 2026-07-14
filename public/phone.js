// 

// const peer = new RTCPeerConnection();
// //used to verify
// console.log(peer.connectionState);  // overall connection

// console.log(peer.signalingState);  // tracks the negotitation (offers)

// console.log(peer.iceConnectionStalte); // ICE CANDIDATES


async function start() {

    console.log("1. Creating peer");

    const peer = new RTCPeerConnection();
    peer.createDataChannel("chat");
    peer.onicecandidate = (event) => {
        console.log("ICE Event Fired");
        console.log(event.candidate);
    };

    console.log("2. Creating offer");

    const offer = await peer.createOffer();
    peer.onicegatheringstatechange = () => {
        console.log("ICE Gathering State:", peer.iceGatheringState);
    };

    peer.oniceconnectionstatechange = () => {
        console.log("ICE Connection State:", peer.iceConnectionState);
    };

    peer.onconnectionstatechange = () => {
        console.log("Connection State:", peer.connectionState);
    };
    console.log("3. Offer created");

    await peer.setLocalDescription(offer);
    console.log("ICE Gathering:", peer.iceGatheringState);

    console.log("4. Local description set");

}



const socket = new WebSocket("ws://localhost:3000");
let peer;
socket.onopen = () => {
    socket.send(JSON.stringify({
        type: "join",
        room: "abc123",
        payload: {
            role: "phone",
        }
    }));
}


socket.onmessage = async (event) => {
    const message = JSON.parse(event.data);
    if (message.type == "peer-joined") {
        peer = new RTCPeerConnection();
        peer.createDataChannel("chat");
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        peer.onicecandidate = (event) => {

            if (!event.candidate) return;

            socket.send(JSON.stringify({

                type: "ice-candidate",

                room: "abc123",

                payload: event.candidate

            }));

        };
        socket.send(JSON.stringify({
            type: "offer",
            room: "abc123",
            payload: offer

        }));
    }
    if (message.type === "answer") {

        await peer.setRemoteDescription(
            message.payload
        );

    }
}
