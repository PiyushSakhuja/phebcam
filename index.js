/**
 * Phebcam signaling server
 *
 * Responsibilities of this server:
 *   - Serve the static frontend (public/)
 *   - Relay WebRTC signaling messages (offer / answer / ice-candidate)
 *     between a "camera" client and "viewer" client(s) inside the same room.
 *
 * This server never sees, receives, or stores video/audio media.
 * Media flows directly between browsers via a WebRTC peer-to-peer
 * connection once signaling has completed successfully.
 *
 * Rooms:
 *   Each session is identified by a room id (a short string in the URL,
 *   e.g. /phone.html?room=ABC123 or /viewer.html?room=ABC123).
 *   Signaling messages are only relayed to other sockets in the same room,
 *   so multiple independent camera/viewer pairs can use this server at once
 *   without crosstalk.
 *
 * This is intentionally simple: one camera and one (or more) viewers per
 * room, in-memory only, no persistence, no auth. See README.md for the
 * documented limitations of this approach.
 */

const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// room -> { cameras: Set<socketId>, viewers: Set<socketId> }
const rooms = new Map();

function getRoom(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { cameras: new Set(), viewers: new Set() });
  }
  return rooms.get(roomId);
}

function cleanupEmptyRoom(roomId) {
  const room = rooms.get(roomId);
  if (room && room.cameras.size === 0 && room.viewers.size === 0) {
    rooms.delete(roomId);
  }
}

function isValidRoomId(roomId) {
  return typeof roomId === 'string' && /^[A-Za-z0-9_-]{1,64}$/.test(roomId);
}

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  let joinedRoom = null;
  let joinedRole = null;

  socket.on('join', ({ room, role }) => {
    if (!isValidRoomId(room)) {
      socket.emit('join-error', { message: 'Invalid or missing room id.' });
      return;
    }
    if (role !== 'camera' && role !== 'viewer') {
      socket.emit('join-error', { message: 'Invalid role. Must be "camera" or "viewer".' });
      return;
    }

    joinedRoom = room;
    joinedRole = role;

    socket.join(room);
    const roomState = getRoom(room);

    if (role === 'camera') {
      roomState.cameras.add(socket.id);
    } else {
      roomState.viewers.add(socket.id);
    }

    console.log(`[room ${room}] ${role} joined (${socket.id})`);

    // Let a newly joined viewer know whether a camera is already present,
    // and let a newly joined camera know a viewer is already waiting.
    if (role === 'viewer') {
      socket.emit('camera-status', { present: roomState.cameras.size > 0 });
      // Ask any existing camera to (re)send a fresh offer for this viewer.
      if (roomState.cameras.size > 0) {
        socket.to(room).emit('viewer-joined', { viewerId: socket.id });
      }
    } else if (role === 'camera') {
      socket.emit('viewer-status', { present: roomState.viewers.size > 0 });
      // If viewers were already waiting, nudge this camera to offer to them.
      if (roomState.viewers.size > 0) {
        socket.emit('viewer-joined', { viewerId: null });
      }
    }
  });

  // --- Signaling relay: only within the same room ---
  socket.on('offer', (data) => {
    if (!joinedRoom) return;
    socket.to(joinedRoom).emit('offer', { ...data, from: socket.id });
  });

  socket.on('answer', (data) => {
    if (!joinedRoom) return;
    socket.to(joinedRoom).emit('answer', { ...data, from: socket.id });
  });

  socket.on('ice-candidate', (data) => {
    if (!joinedRoom) return;
    socket.to(joinedRoom).emit('ice-candidate', { ...data, from: socket.id });
  });

  socket.on('camera-stopped', () => {
    if (!joinedRoom) return;
    socket.to(joinedRoom).emit('camera-stopped');
  });

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected: ${socket.id} (${reason})`);
    if (joinedRoom) {
      const roomState = rooms.get(joinedRoom);
      if (roomState) {
        if (joinedRole === 'camera') {
          roomState.cameras.delete(socket.id);
          socket.to(joinedRoom).emit('camera-stopped');
        } else if (joinedRole === 'viewer') {
          roomState.viewers.delete(socket.id);
          socket.to(joinedRoom).emit('viewer-left', { viewerId: socket.id });
        }
        cleanupEmptyRoom(joinedRoom);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log('========================================');
  console.log('  Phebcam signaling server');
  console.log(`  Listening on http://localhost:${PORT}`);
  console.log('  This server relays WebRTC signaling only.');
  console.log('  It does not receive or store video/audio.');
  console.log('========================================');
});

// Graceful shutdown
function shutdown(signal) {
  console.log(`\n[server] Received ${signal}, shutting down gracefully...`);
  io.close(() => {
    console.log('[server] Socket.IO connections closed.');
  });
  server.close(() => {
    console.log('[server] HTTP server closed.');
    process.exit(0);
  });

  // Force-exit if shutdown hangs
  setTimeout(() => {
    console.error('[server] Forced shutdown after timeout.');
    process.exit(1);
  }, 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  console.error('[server] Uncaught exception:', err);
});

process.on('unhandledRejection', (err) => {
  console.error('[server] Unhandled rejection:', err);
});
