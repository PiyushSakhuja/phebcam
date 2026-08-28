const { io } = require('socket.io-client');
const URL = 'http://localhost:3000';

let pass = 0, fail = 0;
function check(name, cond) {
  if (cond) { console.log(`PASS: ${name}`); pass++; }
  else { console.log(`FAIL: ${name}`); fail++; }
}

const badRoom = io(URL);
badRoom.on('connect', () => badRoom.emit('join', { room: 'bad room!', role: 'camera' }));
badRoom.on('join-error', (data) => {
  check('invalid room id rejected', /Invalid/.test(data.message));
  badRoom.disconnect();

  const badRole = io(URL);
  badRole.on('connect', () => badRole.emit('join', { room: 'VALID1', role: 'hacker' }));
  badRole.on('join-error', (data2) => {
    check('invalid role rejected', /Invalid role/.test(data2.message));
    badRole.disconnect();

    const missingRoom = io(URL);
    missingRoom.on('connect', () => missingRoom.emit('join', { role: 'camera' }));
    missingRoom.on('join-error', (data3) => {
      check('missing room id rejected', /Invalid/.test(data3.message));
      missingRoom.disconnect();
      finish();
    });
  });
});

function finish() {
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

setTimeout(() => {
  console.log('TIMEOUT');
  console.log(`${pass} passed, ${fail} failed`);
  process.exit(1);
}, 8000);
