# Phebcam

### Turn your phone into a wireless webcam.

Phebcam is a WebRTC-based application that lets you use your **phone camera as a webcam for your PC or laptop**.

The phone streams its camera directly to a PC browser using WebRTC. The PC can then capture the Phebcam viewer through **OBS Browser Source** and expose it to other applications using **OBS Virtual Camera**.

```text
📱 PHONE
   │
   │ WebRTC
   ▼
Phebcam
   │
   ▼
💻 PC / LAPTOP
   │
   │ OBS Browser Source
   ▼
OBS
   │
   │ Virtual Camera
   ▼
🎥 Zoom / Discord / Google Meet / Teams / etc.
```

## 🚀 Live Demo

**[Open Phebcam](https://phebcamm.onrender.com/)**

The hosted version is provided primarily as a **demo**.

It runs on Render's free web-service tier, which can spin down after 15 minutes without incoming traffic. When that happens, the next request has to wake the service, which can take around a minute.

For actually using Phebcam for an extended session, **run it locally on your PC** using the instructions below.

---

# ✨ Features

* 📱 Use a phone camera as a wireless webcam
* ⚡ WebRTC peer-to-peer video streaming
* 🔗 Room-based camera/viewer sessions
* 🔒 Session isolation
* 🎥 OBS Browser Source integration
* 📹 OBS Virtual Camera support
* 🔄 Front/back camera switching
* 🪞 Camera mirror toggle
* 🖥️ Desktop-optimized viewer
* 📱 Mobile-first camera interface
* 📐 Live video resolution information
* 🎞️ Real FPS information from WebRTC statistics
* 🔌 Connection and ICE status
* ⛔ Explicit camera start/stop controls
* 🔄 Socket reconnection handling
* 🛡️ No video recording or server-side video storage

---

# 🧠 How It Works

Phebcam uses **WebRTC** for the actual video connection and **Socket.IO** only for signaling.

### Signaling

```text
Phone
  │
  │ offer
  ▼
Socket.IO Server
  │
  │ offer
  ▼
PC Viewer

PC
  │
  │ answer
  ▼
Socket.IO Server
  │
  │ answer
  ▼
Phone
```

ICE candidates are also exchanged through the signaling server.

Once the WebRTC connection is established, the video is sent through the peer connection rather than being streamed through the Node.js server.

### Actual architecture

```text
                 ┌─────────────────┐
                 │  Node.js Server │
                 │    Express      │
                 │    Socket.IO    │
                 └────────┬────────┘
                          │
                     Signaling
                          │
              ┌───────────┴───────────┐
              │                       │
              ▼                       ▼
        📱 Phone                  💻 PC
        Camera                   Viewer
              │                       │
              └────── WebRTC ─────────┘
                       Video
```

The server handles signaling.

The server does **not** receive or store the camera video as part of the current architecture.

---

# 🎯 How To Use Phebcam

## Option 1 — Live Demo

Open:

**https://phebcamm.onrender.com/**

### On your phone

1. Open Phebcam.
2. Select **Use Phone as Webcam**.
3. Tap **Start Camera**.
4. Allow camera permission.
5. Note the generated room/session code.

### On your PC

1. Open Phebcam.
2. Select **I'm on the PC**.
3. Enter the phone's room code.
4. Connect.
5. Your phone camera should appear in the viewer.

### Then use OBS

1. Open OBS.
2. Add a **Browser Source**.
3. Use the Phebcam viewer URL.
4. Enter the same room/session code.
5. Confirm that the phone video appears in OBS.
6. Click **Start Virtual Camera** in OBS.
7. Open your video application.
8. Select **OBS Virtual Camera** as the camera.

The final pipeline is:

```text
Phone Camera
     ↓
Phebcam
     ↓
PC Viewer
     ↓
OBS Browser Source
     ↓
OBS Virtual Camera
     ↓
Zoom / Discord / Meet / Teams
```

---

# 💻 Recommended: Run Phebcam Locally

For longer sessions, local hosting is recommended.

The Render free service can sleep after 15 minutes of inactivity, so the hosted version is best treated as a demonstration rather than a continuously available service.

Running locally also gives you a much simpler development/testing environment.

---

# 🛠️ Local Setup

## Requirements

Install:

* Node.js
* npm
* Git

Check your installation:

```bash
node --version
npm --version
```

---

## 1. Clone the repository

```bash
git clone https://github.com/PiyushSakhuja/phebcam.git
```

Enter the project:

```bash
cd phebcam
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Start the server

```bash
npm start
```

The server runs on:

```text
http://localhost:3000
```

Open that address on your PC.

---

# 📱 Using Your Phone With A Local Server

If the phone and PC are connected to the **same Wi-Fi network**, you can access the local server from the phone using your PC's local IP address.

### Find your PC's IP address

On Windows PowerShell:

```powershell
ipconfig
```

Look for:

```text
IPv4 Address
```

For example:

```text
192.168.1.105
```

Your phone can then open:

```text
http://192.168.1.105:3000
```

instead of:

```text
http://localhost:3000
```

### Important

`localhost` on your phone means **the phone itself**, not your PC.

So:

```text
❌ http://localhost:3000
```

on the phone is usually wrong.

Use:

```text
✅ http://YOUR_PC_IP:3000
```

when testing across your local network.

---

# 🔐 Camera Permissions

The browser must explicitly grant camera access.

Phebcam does **not** automatically start the camera when the page loads.

The user must press:

```text
Start Camera
```

and grant permission.

The camera can be stopped using:

```text
Stop Camera
```

which releases the active media tracks.

---

# 🎥 OBS Setup

Phebcam does not create a native operating-system webcam device itself.

Instead:

```text
Phebcam Viewer
       ↓
OBS Browser Source
       ↓
OBS Scene
       ↓
OBS Virtual Camera
       ↓
Desktop Applications
```

### Step 1 — Open OBS

Install and open OBS Studio.

### Step 2 — Add Browser Source

In OBS:

```text
Sources
  ↓
+
  ↓
Browser
```

### Step 3 — Enter the viewer URL

Use the Phebcam viewer URL with your room code.

Example:

```text
https://phebcamm.onrender.com/viewer.html?room=ABC123&obs=true
```

For local use:

```text
http://localhost:3000/viewer.html?room=ABC123&obs=true
```

or, when accessing from another device:

```text
http://YOUR_PC_IP:3000/viewer.html?room=ABC123&obs=true
```

### Step 4 — Start Virtual Camera

Once the phone video appears in OBS:

```text
Start Virtual Camera
```

### Step 5 — Select the camera

In applications such as Zoom, Discord, Google Meet, or Teams, select:

```text
OBS Virtual Camera
```

---

# 🌐 Networking

Phebcam currently uses WebRTC with no TURN server configured by default.

This means connectivity can depend on the network environment.

### Same network

The application is designed to work well for local/LAN experimentation when browser security requirements are satisfied.

```text
Phone ─── Wi-Fi ─── PC
```

### Different networks

For example:

```text
Phone ─── Mobile Network

             Internet

PC ─────── Home Wi-Fi
```

This may fail with the current configuration.

A production-oriented version would typically add appropriate **STUN/TURN infrastructure** to improve connectivity across restrictive NATs and different networks.

Phebcam intentionally does not claim universal cross-network connectivity.

---

# 🔒 Privacy

Phebcam is designed around explicit camera access.

* Camera permission is requested by the browser.
* Camera capture starts only after user interaction.
* Video is transmitted using WebRTC.
* Socket.IO is used for signaling.
* The current server does not record camera video.
* No camera recordings are stored by Phebcam.
* Stopping the camera stops the active media tracks.

Phebcam does not secretly capture or record camera footage.

---

# 🧪 Testing

The project includes automated tests for the server and static application structure.

Run:

```bash
npm test
```

Current test coverage includes:

* signaling relay
* room isolation
* input validation
* static HTML structure
* camera start behavior
* camera stop behavior
* WebRTC wiring
* no hardcoded TURN credentials

Current automated test result:

```text
24 / 24 passing
```

### Manual testing

The following should also be tested with real devices:

```text
✓ Phone camera starts
✓ PC viewer connects
✓ Video appears
✓ Camera can be stopped
✓ Front/back camera switching
✓ Mirror toggle
✓ Phone rotation
✓ Viewer disconnect
✓ Camera disconnect
✓ OBS Browser Source
✓ OBS Virtual Camera
✓ Desktop application receives video
```

Hardware-dependent WebRTC/OBS behavior cannot be completely verified through automated server tests.

---

# 📂 Project Structure

```text
phebcam/
│
├── public/
│   ├── index.html
│   ├── phone.html
│   ├── viewer.html
│   └── style.css
│
├── tests/
│   ├── ...
│
├── index.js
├── package.json
├── README.md
└── TESTING.md
```

---

# 🧩 Technology Stack

### Frontend

* HTML
* CSS
* JavaScript
* MediaDevices API
* WebRTC APIs

### Backend

* Node.js
* Express
* Socket.IO

### Integration

* OBS Studio
* OBS Browser Source
* OBS Virtual Camera

No frontend framework is required.

---

# ⚠️ Current Limitations

Phebcam is a personal/educational project and is not intended to be a production video-conferencing service.

Current limitations:

* No TURN server by default
* Cross-network WebRTC connectivity may fail
* Room state is stored in memory
* No user authentication
* No persistent sessions
* No automatic WebRTC peer reconnection after every failure
* Render free deployment can sleep when idle
* The hosted demo may take time to wake after inactivity
* OBS is required to expose the stream as a system virtual camera
* Camera quality depends on the phone, browser, network, and WebRTC connection

For long-running use, run Phebcam locally or use an always-on server configuration.

---

# 🚀 Future Improvements

Potential future work:

* STUN/TURN configuration
* More reliable cross-network connectivity
* Automatic WebRTC reconnection
* Persistent room/session management
* Better connection diagnostics
* Bitrate/resolution controls
* Audio streaming
* Camera quality presets
* Native desktop companion
* Native virtual-camera integration without requiring OBS

---


# 📌 Project Goal

The goal of Phebcam is to explore how a browser-based camera stream can be transported in real time using WebRTC and then integrated into the desktop webcam ecosystem through OBS.

The project combines:

```text
Browser Camera APIs
        +
WebRTC
        +
Real-time Signaling
        +
Socket.IO
        +
OBS Integration
```

into a practical wireless webcam workflow.

---

# License

MIT License.

Built for learning, experimentation, and personal use.

---

<p align="center">
  <strong>Phebcam</strong><br>
  Turn your phone into a wireless webcam.
</p>
