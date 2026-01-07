const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: process.env.PORT || 8080 });

let senders = [];
let viewers = [];

wss.on("connection", ws => {
  ws.id = Math.random().toString(36).slice(2, 8);

  ws.on("message", msg => {
    const data = JSON.parse(msg);

    // 1️⃣ Registro de rol
    if (data.type === "role") {
      ws.role = data.role;

      if (ws.role === "sender") senders.push(ws);
      if (ws.role === "viewer") viewers.push(ws);

      tryPair();
    }

    // 2️⃣ Reenvío de señal WebRTC
    if (data.type === "signal") {
      const peer = [...wss.clients].find(c => c.id === data.to);
      if (peer) {
        peer.send(JSON.stringify({
          type: "signal",
          payload: data.payload
        }));
      }
    }
  });

  ws.on("close", () => {
    senders = senders.filter(c => c !== ws);
    viewers = viewers.filter(c => c !== ws);
  });
});

// 🔗 Emparejar sender + viewer
function tryPair() {
  if (senders.length > 0 && viewers.length > 0) {
    const sender = senders.shift();
    const viewer = viewers.shift();

    sender.peer = viewer.id;
    viewer.peer = sender.id;

    sender.send(JSON.stringify({ type: "paired", peer: viewer.id }));
    viewer.send(JSON.stringify({ type: "paired", peer: sender.id }));
  }
}

console.log("🚀 Relay WebSocket activo");
