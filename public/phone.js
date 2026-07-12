const video = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const statusText = document.getElementById("status");

const ctx = canvas.getContext("2d");

let socket;

async function startCamera() {

    const stream = await navigator.mediaDevices.getUserMedia({

        video: {
            width: 640,
            height: 480
        },

        audio: false

    });

    video.srcObject = stream;

    await video.play();

    statusText.innerText = "Camera started";

    connectWebSocket();

}

function connectWebSocket() {

    const protocol =
        location.protocol === "https:"
            ? "wss"
            : "ws";

    socket = new WebSocket(
        `${protocol}://${location.host}`
    );

    socket.onopen = () => {

        console.log("Connected to server");

        socket.send("PHONE");

        statusText.innerText =
            "Connected. Streaming...";

        startStreaming();

    };

}

function startStreaming() {

    setInterval(() => {

        if (
            socket.readyState !== WebSocket.OPEN
        ) {
            return;
        }

        ctx.drawImage(
            video,
            0,
            0,
            canvas.width,
            canvas.height
        );

        canvas.toBlob(

            (blob) => {

                if (blob) {

                    socket.send(blob);

                }

            },

            "image/jpeg",

            0.7

        );

    }, 33);

}

startCamera();