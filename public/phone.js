const socket = new WebSocket(
    `ws://${location.host}`
);

let peer;
let channel;


socket.onopen = () => {

    console.log("WebSocket connected");

    socket.send(JSON.stringify({

        type: "join",

        room: "abc123",

        payload: {
            role: "phone"
        }

    }));

};


socket.onmessage = async (event) => {

    const message =
        JSON.parse(event.data);


    // OTHER PEER IS READY

    if (message.type === "peer-joined") {

        console.log("Peer joined");

        createPeer();

        channel =
            peer.createDataChannel("chat");


        channel.onopen = () => {

            console.log(
                "DATA CHANNEL OPEN!"
            );

            channel.send(
                "Hello from phone!"
            );

        };


        const offer =
            await peer.createOffer();


        await peer.setLocalDescription(
            offer
        );


        socket.send(JSON.stringify({

            type: "offer",

            room: "abc123",

            payload: offer

        }));

    }


    // ANSWER FROM LAPTOP

    if (message.type === "answer") {

        console.log(
            "Answer received"
        );

        await peer.setRemoteDescription(
            message.payload
        );

    }


    // ICE FROM LAPTOP

    if (
        message.type ===
        "ice-candidate"
    ) {

        await peer.addIceCandidate(
            message.payload
        );

    }

};


function createPeer() {

    peer =
        new RTCPeerConnection();


    peer.onicecandidate = (event) => {

        if (!event.candidate) {
            return;
        }

        socket.send(JSON.stringify({

            type: "ice-candidate",

            room: "abc123",

            payload:
                event.candidate

        }));

    };


    peer.onconnectionstatechange = () => {

        console.log(
            "Connection:",
            peer.connectionState
        );

    };


    peer.oniceconnectionstatechange = () => {

        console.log(
            "ICE:",
            peer.iceConnectionState
        );

    };

}