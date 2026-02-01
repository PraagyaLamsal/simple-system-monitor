const si = require("systeminformation");

async function getPrimaryInterface() {
  const def = await si.networkInterfaceDefault();
  if (def) return def;

  const ifaces = await si.networkInterfaces();
  const candidates = ifaces.filter(i =>
    i.operstate === "up" &&
    !i.internal &&
    i.ip4 &&
    !i.virtual // many virtual adapters set this
  );

  const wifi = candidates.find(i =>
    (i.ifaceName || "").toLowerCase().includes("wi-fi") ||
    (i.type || "").toLowerCase().includes("wireless")
  );

  return (wifi?.iface) || (candidates[0]?.iface) || null;
}

async function getSnapshot() {
  const primaryIface = await getPrimaryInterface();

  const [cpuLoad, mem, disks, graphics, netStats] = await Promise.all([
    si.currentLoad(),
    si.mem(),
    si.fsSize(),
    si.graphics(),
    primaryIface ? si.networkStats(primaryIface) : si.networkStats(),
  ]);

  const netArr = Array.isArray(netStats) ? netStats : [];
  const cleanedNet = netArr.map(n => ({
    iface: n.iface,
    rxSec: n.rx_sec ?? 0,
    txSec: n.tx_sec ?? 0,
  }));

  return {
    ts: Date.now(),
    cpu: {
      load: cpuLoad.currentLoad,
      cores: cpuLoad.cpus.map(c => c.load),
    },
    gpu: (graphics.controllers || []).map(g => ({
      name: g.model || g.name || "GPU",
      vendor: g.vendor,
      vramMB: g.vram,
      util: g.utilizationGpu,
      memUtil: g.utilizationMemory,
      tempC: g.temperatureGpu,
    })),
    mem: {
      total: mem.total,
      used: mem.used,
      usedPercent: (mem.used / mem.total) * 100,
    },
    disk: (disks || []).map(d => ({
      mount: d.mount,
      used: d.used,
      size: d.size,
      usedPercent: d.use,
    })),
    net: cleanedNet,
    primaryIface,
  };
}

module.exports = { getSnapshot };