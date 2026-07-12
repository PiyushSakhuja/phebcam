const image = document.getElementById("stream");

const statusText =
    document.getElementById("status");

const fpsText =
    document.getElementById("fps");

const frameSizeText =
    document.getElementById("frameSize");

const bandwidthText =
    document.getElementById("bandwidth");


const protocol =
    location.protocol === "https:"
        ? "wss"
        : "ws";


const socket = new WebSocket(
    `${protocol}://${location.host}`
);


socket.binaryType = "blob";


let previousURL = null;


let frameCount = 0;

let bytesReceived = 0;

let lastMeasureTime = performance.now();


socket.onopen = () => {

    console.log("Connected");

    socket.send("VIEWER");

    statusText.innerText =
        "Waiting for camera...";

};


socket.onmessage = (event) => {

    frameCount++;

    bytesReceived += event.data.size;


    const frameSizeKB =
        event.data.size / 1024;


    frameSizeText.innerText =
        frameSizeKB.toFixed(2);


    const imageURL =
        URL.createObjectURL(event.data);


    image.src = imageURL;


    if (previousURL) {

        URL.revokeObjectURL(previousURL);

    }


    previousURL = imageURL;


    statusText.innerText =
        "Receiving video";


    calculateStats();

};


function calculateStats() {

    const now = performance.now();

    const elapsed =
        now - lastMeasureTime;


    if (elapsed >= 1000) {

        const seconds =
            elapsed / 1000;


        const fps =
            frameCount / seconds;


        const bitsReceived =
            bytesReceived * 8;


        const bandwidthMbps =
            bitsReceived /
            seconds /
            1_000_000;


        fpsText.innerText =
            fps.toFixed(2);


        bandwidthText.innerText =
            bandwidthMbps.toFixed(2);


        frameCount = 0;

        bytesReceived = 0;

        lastMeasureTime = now;

    }

}