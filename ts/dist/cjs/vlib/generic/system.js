var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  System: () => System
});
module.exports = __toCommonJS(stdin_exports);
var os = __toESM(require("os"));
var sysinfo = __toESM(require("sysinfo"));
var System;
(function(System2) {
  function format_bytes(bytes) {
    if (bytes > 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
    } else if (bytes > 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    } else if (bytes > 1024) {
      return `${(bytes / 1024).toFixed(2)}KB`;
    }
    return `${bytes.toFixed(2)}B`;
  }
  System2.format_bytes = format_bytes;
  function cpu_usage() {
    const cpus = os.cpus();
    let total_time = 0;
    let total_used = 0;
    cpus.forEach((cpu) => {
      const cpu_total = Object.values(cpu.times).reduce((acc, tv) => acc + tv, 0);
      const cpu_used = cpu_total - cpu.times.idle;
      total_time += cpu_total;
      total_used += cpu_used;
    });
    return total_used / total_time * 100;
  }
  System2.cpu_usage = cpu_usage;
  function memory_usage(format = true) {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    return {
      total: format ? System2.format_bytes(total) : total,
      used: format ? System2.format_bytes(used) : used,
      free: format ? System2.format_bytes(free) : free,
      used_percentage: used / total * 100
    };
  }
  System2.memory_usage = memory_usage;
  async function network_usage(format = true) {
    const stats = await sysinfo.networkStats();
    let sent = 0;
    let received = 0;
    stats.forEach((iface) => {
      sent += iface.tx_bytes;
      received += iface.rx_bytes;
    });
    return {
      sent: format ? System2.format_bytes(sent) : sent,
      received: format ? System2.format_bytes(received) : received
    };
  }
  System2.network_usage = network_usage;
})(System || (System = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  System
});
