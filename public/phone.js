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

start();