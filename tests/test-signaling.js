const { io } = require('socket.io-client');

const ROOM = 'TEST01';
const URL = 'http://localhost:3000';

const camera = io(URL, { autoConnect: false });
const viewer = io(URL);

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { console.log(`PASS: ${name}`); pass++; }
  else { console.log(`FAIL: ${name}`); fail++; }
}

// Join viewer first, wait for ack, then join camera so ordering is deterministic.
let viewerReady = false;
viewer.on('connect', () => viewer.emit('join', { room: ROOM, role: 'viewer' }));
viewer.on('camera-status', (data) => {
  check('viewer sees camera present (initially false)', data.present === false);
  viewerReady = true;
  camera.connect();
});

camera.on('connect', () => camera.emit('join', { room: ROOM, role: 'camera' }));

camera.on('viewer-status', (data) => {
  check('camera sees viewer present', data.present === true && viewerReady);
});

camera.on('viewer-joined', () => {
  camera.emit('offer', { type: 'offer', sdp: 'fake-sdp' });
});

viewer.on('offer', (data) => {
  check('viewer received offer from camera', data.sdp === 'fake-sdp');
  viewer.emit('answer', { type: 'answer', sdp: 'fake-answer' });
});

camera.on('answer', (data) => {
  check('camera received answer from viewer', data.sdp === 'fake-answer');

  // Test ICE relay
  camera.emit('ice-candidate', { candidate: 'fake-ice-camera' });
});

viewer.on('ice-candidate', (data) => {
  check('viewer received ICE candidate from camera', data.candidate === 'fake-ice-camera');

  // Now test camera-stopped propagation
  camera.emit('camera-stopped');
});

viewer.on('camera-stopped', () => {
  check('viewer notified when camera stops', true);
  finish();
});

// Cross-room isolation test
const camera2 = io(URL);
const viewer2 = io(URL);
let crossTalkDetected = false;

camera2.on('connect', () => camera2.emit('join', { room: 'ROOMB', role: 'camera' }));
viewer2.on('connect', () => viewer2.emit('join', { room: 'ROOMC', role: 'viewer' }));

viewer2.on('offer', () => { crossTalkDetected = true; });

setTimeout(() => {
  camera2.emit('offer', { type: 'offer', sdp: 'should-not-cross' });
}, 500);

function finish() {
  setTimeout(() => {
    check('no cross-room signaling leak', !crossTalkDetected);
    console.log(`\n${pass} passed, ${fail} failed`);
    camera.disconnect();
    viewer.disconnect();
    camera2.disconnect();
    viewer2.disconnect();
    process.exit(fail > 0 ? 1 : 0);
  }, 800);
}

setTimeout(() => {
  console.log('TIMEOUT — some events never fired');
  console.log(`${pass} passed, ${fail} failed`);
  process.exit(1);
}, 8000);
