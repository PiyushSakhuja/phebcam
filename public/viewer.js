const socket = new WebSocket(
    `ws://${location.host}`
);

let peer =
    new RTCPeerConnection();


socket.onopen = () => {

    console.log(
        "WebSocket connected"
    );

    socket.send(JSON.stringify({

        type: "join",

        room: "abc123",

        payload: {
            role: "viewer"
        }

    }));

};


// RECEIVE DATA CHANNEL

peer.ondatachannel = (event) => {

    const channel =
        event.channel;


    console.log(
        "Data channel received:",
        channel.label
    );


    channel.onopen = () => {

        console.log(
            "DATA CHANNEL OPEN!"
        );

    };


    channel.onmessage = (event) => {

        console.log(
            "PHONE SAYS:",
            event.data
        );

    };

};


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


socket.onmessage = async (event) => {

    const message =
        JSON.parse(event.data);


    // PHONE OFFER

    if (message.type === "offer") {

        console.log(
            "Offer received"
        );


        await peer.setRemoteDescription(
            message.payload
        );


        const answer =
            await peer.createAnswer();


        await peer.setLocalDescription(
            answer
        );


        socket.send(JSON.stringify({

            type: "answer",

            room: "abc123",

            payload: answer

        }));

    }


    // ICE FROM PHONE

    if (
        message.type ===
        "ice-candidate"
    ) {

        await peer.addIceCandidate(
            message.payload
        );

    }

};