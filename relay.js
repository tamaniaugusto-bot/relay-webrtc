const WebSocket = require("ws");
const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ port: PORT });
let waiting = [];

wss.on("connection", ws => {
  ws.id = Math.random().toString(36).slice(2, 8);
  waiting.push(ws);

  if (waiting.length >= 2) {
    const a = waiting.shift();
    const b = waiting.shift();

    a.peer = b.id;
    b.peer = a.id;

    a.send(JSON.stringify({ type: "paired", peer: b.id }));
    b.send(JSON.stringify({ type: "paired", peer: a.id }));
  }

  ws.on("message", msg => {
    const data = JSON.parse(msg);
    const peer = [...wss.clients].find(c => c.id === data.to);
    if (peer) peer.send(JSON.stringify({
      type: "signal",
      payload: data.payload
    }));
  });

  ws.on("close", () => {
    waiting = waiting.filter(c => c !== ws);
  });
});

console.log("🚀 Relay activo");
