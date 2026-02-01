import { useEffect, useState } from "react";

function fmtBytesPerSec(bps) {
  const units = ["B/s", "KB/s", "MB/s", "GB/s"];
  let i = 0;
  let n = bps ?? 0;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(1)} ${units[i]}`;
}

export default function App() {
  const [snap, setSnap] = useState(null);
  const [status, setStatus] = useState("connecting...");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3001/stream");
    ws.onopen = () => setStatus("connected");
    ws.onclose = () => setStatus("disconnected");
    ws.onerror = () => setStatus("error");
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === "snapshot") setSnap(msg.data);
    };
    return () => ws.close();
  }, []);

  if (!snap) return <div style={{ padding: 16, fontFamily: "system-ui" }}>{status}</div>;

  const cpu = snap.cpu?.load ?? 0;
  const mem = snap.mem?.usedPercent ?? 0;
  const net0 = (snap.net || [])[0];

  return (
    <div style={{ padding: 16, fontFamily: "system-ui", lineHeight: 1.6 }}>
      <h2>System Monitor</h2>
      <div>Status: {status}</div>
      <div>Interface: {snap.primaryIface || "?"}</div>

      <hr />

      <div><b>CPU</b>: {cpu.toFixed(1)}%</div>
      <div><b>Memory</b>: {mem.toFixed(1)}%</div>

      <hr />

      <div><b>GPU</b>:</div>
      {(snap.gpu || []).length === 0 ? (
        <div>None detected</div>
      ) : (
        (snap.gpu || []).map((g, idx) => (
          <div key={idx} style={{ marginLeft: 12 }}>
            {g.name} — util: {g.util ?? "n/a"}% | temp: {g.tempC ?? "n/a"}°C | vram: {g.vramMB ?? "n/a"} MB
          </div>
        ))
      )}

      <hr />

      <div><b>Disk</b>:</div>
      {(snap.disk || []).map((d, idx) => (
        <div key={idx} style={{ marginLeft: 12 }}>
          {d.mount}: {Number(d.usedPercent).toFixed(1)}%
        </div>
      ))}

      <hr />

      <div><b>Network</b>:</div>
      {net0 ? (
        <div style={{ marginLeft: 12 }}>
          {net0.iface} — RX {fmtBytesPerSec(net0.rxSec)} | TX {fmtBytesPerSec(net0.txSec)}
        </div>
      ) : (
        <div style={{ marginLeft: 12 }}>No network stats</div>
      )}
    </div>
  );
}
