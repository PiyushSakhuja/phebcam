const image = document.querySelector("img");
const socket = new WebSocket(
    `ws://${location.host}`
);

const remoteVideo =
document.getElementById(
    "remoteVideo"
);

const statusText =
document.getElementById(
    "status"
);


let peer =
new RTCPeerConnection();

let previousBytes = 0;
let previousTimestamp = 0;

async function showStats() {
    
    const stats = await peer.getStats();
    
    stats.forEach(report => {

        if (
            report.type === "inbound-rtp" &&
            report.kind === "video"
        ) {
            
            console.log(
                "Resolution:",
                report.frameWidth,
                "x",
                report.frameHeight
            );
            
            console.log(
                "FPS:",
                report.framesPerSecond
            );
            
            console.log(
                "Packets Lost:",
                report.packetsLost
            );

            console.log(
                "Jitter:",
                report.jitter
            );
            
            
            // Calculate bitrate
            
            if (
                previousTimestamp &&
                previousBytes
            ) {
                
                const bytesDifference =
                report.bytesReceived -
                previousBytes;
                
                const timeDifference =
                report.timestamp -
                previousTimestamp;
                
                const bitrate =
                (
                    bytesDifference *
                    8 /
                    timeDifference
                );
                
                console.log(
                    "Bitrate:",
                    bitrate.toFixed(2),
                    "kbps"
                );

            }
            
            
            previousBytes =
            report.bytesReceived;
            
            previousTimestamp =
            report.timestamp;
            
        }
        
    });
    
}
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


// RECEIVE VIDEO TRACK


peer.ontrack = async (event) => {
    console.log("Video track received");
    console.log("Track:", event.track);
    console.log("Streams:", event.streams);

    remoteVideo.srcObject = event.streams[0];

    try {
        await remoteVideo.play();
        console.log("Video playing");
    } catch (error) {
        console.error("Video play failed:", error);
    }
};


// SEND ICE

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


// CONNECTION STATE

peer.onconnectionstatechange = () => {

    console.log(
        "Connection:",
        peer.connectionState
    );

};


// RECEIVE SIGNALING

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


    // PHONE ICE

    if (
        message.type ===
        "ice-candidate"
    ) {

        await peer.addIceCandidate(
            message.payload
        );

    }

};

setInterval(
    showStats,
    1000
);


async function getip() {
    const res = await fetch('/api/get-ip');
    const data = await res.json();
    return data.ip;
}

async function generateQr(URL) {
    console.log("starting", URL);

    const response = await fetch('/qrcode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            url: URL
        })
    });

    const result = await response.json(); // Parse the JSON response from the server
    console.log('Success:', result);
    return result.qrurl;
    
}

async function test() {
    const ip = await getip();
    console.log(ip);

    const qr = await generateQr(`http://${ip}:3000/phone.html`);
    image.setAttribute("src", qr);
}

test();


