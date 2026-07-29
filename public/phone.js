const socket = new WebSocket(
    `ws://${location.host}`
);

const localVideo =
    document.getElementById("localVideo");

const statusText =
    document.getElementById("status");

let peer;
let stream;


socket.onopen = () => {

    console.log(
        "WebSocket connected"
    );

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


    // LAPTOP IS READY

    if (message.type === "peer-joined") {

        console.log(
            "Viewer joined"
        );

        statusText.innerText =
            "Starting camera...";


        // CREATE PEER

        createPeer();


        // GET CAMERA

        stream =
            await navigator.mediaDevices
                .getUserMedia({

                    video: {
                        width: 1280,
                        height: 720
                    },

                    audio: false

                });


        // SHOW LOCAL PREVIEW

        localVideo.srcObject =
            stream;


        // ADD CAMERA TRACKS TO WEBRTC

        stream
            .getTracks()
            .forEach(track => {

                peer.addTrack(
                    track,
                    stream
                );

            });


        // CREATE OFFER

        const offer =
            await peer.createOffer();


        await peer.setLocalDescription(
            offer
        );


        // SEND OFFER

        socket.send(JSON.stringify({

            type: "offer",

            room: "abc123",

            payload: offer

        }));


        statusText.innerText =
            "Streaming";

    }


    // ANSWER

    if (message.type === "answer") {

        console.log(
            "Answer received"
        );

        await peer.setRemoteDescription(
            message.payload
        );

    }


    // REMOTE ICE CANDIDATE

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