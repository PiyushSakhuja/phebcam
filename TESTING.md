# Testing checklist

This document distinguishes between what was **actually verified in this
development environment** (no phone hardware, no OBS installation, no
GUI browser available) and what still needs to be verified by a person
running the app on real devices.

## Automated tests (verified — 24/24 passing)

Run with:

```bash
npm test
```

- `tests/test-static-structure.js` (14 checks) — every `getElementById`
  call in each page resolves to a real element, no duplicate ids, the
  camera page never auto-invokes `startCamera()` on load (only via the
  Start Camera button's click handler), and the server never contains
  hardcoded TURN credentials.
- `tests/test-signaling.js` (7 checks) — full offer/answer/ICE relay
  through the server between two Socket.IO clients acting as camera and
  viewer, camera-stopped propagation, and cross-room signaling isolation.
- `tests/test-edge-cases.js` (3 checks) — invalid/missing room codes and
  invalid roles are rejected with a clear `join-error`.

These confirm the **server-side signaling logic and page wiring** are
correct. They do **not** exercise real `getUserMedia()`, real WebRTC media
flow, or OBS, because this development environment has no camera
hardware, no display, and no OBS installation.

## Manual checklist — real devices required

Legend: ✅ verified in this session · ⬜ not verified here, needs a person with real hardware · ⚠️ partially verified / caveat

| Check | Status | Notes |
|---|---|---|
| Server starts (`npm start`) | ✅ | Verified — logs startup banner, listens on configured port |
| Landing page loads, buttons route correctly | ✅ | Verified via HTTP requests + static structure test; `Use Phone as Webcam` generates a room code and routes to `phone.html?room=...`, `I'm on the PC` routes to `viewer.html` |
| Camera page loads, requires `?room=` | ✅ | Verified — shows a clear error and disables Start if room is missing |
| Camera never auto-activates | ✅ | Verified statically — `getUserMedia` only called from `startCamera()`, only invoked by the Start Camera button's click handler |
| Viewer page loads without `?room=` (entry screen) | ✅ | Verified — shows room-code entry form instead of a broken viewer |
| Viewer page loads with `?room=` (connects directly) | ✅ | Verified via HTTP request |
| Viewer page loads with `&obs=true` (OBS mode) | ✅ | Verified via HTTP request + CSS rule check (`body.obs-mode` hides topbar/meta bar/lower panel) |
| Camera permission prompt appears on phone | ⬜ | Requires a real phone browser |
| Camera preview works on phone | ⬜ | Requires a real phone camera |
| Front/back camera switch works | ⬜ | Requires a real phone with multiple cameras; logic implemented via `replaceTrack()` without renegotiating the whole connection, not exercised against real hardware |
| Offer/answer/ICE exchange (signaling only) | ✅ | Verified via automated test with two Socket.IO clients |
| Offer/answer/ICE exchange (real WebRTC + real network paths) | ⬜ | Requires two real browsers; this environment can't create real ICE candidates from real network interfaces |
| PC viewer receives and displays phone video | ⬜ | Requires a real phone and PC |
| Video preserves aspect ratio, no stretching | ⚠️ | CSS uses `object-fit: contain` on the viewer stage and `cover` on the phone's own preview — verified by reading the rules, not by visually inspecting a live stream |
| Video resizes correctly, works in fullscreen | ⬜ | Fullscreen API wired to the video stage; needs a real browser to confirm behavior on rotation/resize |
| Portrait and landscape phone orientation | ⬜ | Requires a real phone; the resolution readout is wired to `videoWidth`/`videoHeight`/`resize` event, which should reflect rotation, but this isn't confirmed against a real device |
| Resolution readout matches actual stream | ⬜ | Wired to real `video.videoWidth`/`videoHeight`; needs a live stream to confirm the numbers are correct |
| Frame rate readout | ⬜ | Wired to `RTCStatsReport` `framesPerSecond` when present; whether a given browser reports this value isn't confirmed here |
| Stop Camera releases the phone camera | ⬜ | Code calls `track.stop()` on every track; needs a real device to confirm the camera indicator light actually turns off |
| Viewer disconnect handled on phone side | ✅ (logic) / ⬜ (real device) | Signaling-level `viewer-left` event verified by automated test; real-device confirmation not done |
| Camera disconnect handled on viewer side | ✅ (logic) / ⬜ (real device) | Same as above |
| Socket reconnect after network drop | ⚠️ | Socket.IO client is configured with `reconnection: true` and shows "Connection lost — attempting to reconnect..." on disconnect and "Reconnected — waiting..." on reconnect; not tested against a real network interruption |
| OBS Browser Source displays the viewer | ⬜ | Requires OBS installed on a real machine — not available in this environment |
| OBS Virtual Camera starts and shows the feed | ⬜ | Requires OBS — not available here |
| A third-party app (Zoom/Discord/Meet/Teams) selects OBS Virtual Camera and shows correct video | ⬜ | Requires OBS + a real app — not available here |
| Room code isolation (no crosstalk between rooms) | ✅ | Verified via automated test |
| Invalid/garbage room code rejected | ✅ | Verified via automated test |

## What this means in practice

The **signaling server, page routing, DOM wiring, and CSS-level behavior**
(OBS-mode chrome hiding, aspect-ratio rules, status states, error
messaging, room isolation) have been verified as far as this
environment allows — through automated tests, syntax/structure checks,
and direct HTTP requests against a running server instance.

The **actual phone camera → WebRTC → PC video → OBS Browser Source →
OBS Virtual Camera → third-party app** chain has **not** been run
end-to-end in this session, because doing so requires a physical phone,
a physical PC with OBS installed, and a real target application — none
of which exist in this development sandbox. Anyone deploying this should
walk through the full manual checklist above on real hardware before
relying on it, and update the ⬜ rows with real results.

## What works on the same network (expected, based on code + signaling tests)

Signaling (room join, offer/answer/ICE relay) is confirmed working. Media
flow itself is expected to work on the same network/localhost, consistent
with a typical WebRTC setup with no STUN/TURN needed for same-LAN
connectivity, but this has not been confirmed with real devices in this
session.

## What is expected to fail across different networks

With `iceServers: []` (no STUN or TURN configured), connections between
devices on different networks are expected to fail to establish a direct
peer-to-peer path in many real-world cases (e.g. phone on cellular data,
PC on a different Wi-Fi network, especially behind restrictive NATs).
This has not been tested with real devices in this session, but is a
direct, documented consequence of the current ICE configuration.

## Known limitations at time of writing

- No automated end-to-end test of the phone/OBS/virtual-camera pipeline
  has been performed in this environment — see the checklist above.
- No TURN server configured out of the box.
- Room state is in-memory and lost on server restart.
- No authentication on room codes.
- WebRTC-level reconnection (as opposed to signaling socket
  reconnection) is not automatic; rejoining a room via refresh is the
  current recovery path.
