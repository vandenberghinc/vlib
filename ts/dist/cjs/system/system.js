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
const System = {
  /* @docs:
      @title: Format bytes
      @desc: Format bytes into a converted string with a suffixed B, KB, MB, or GB
      @return:
          Returns the bytes converted into a string suffixed with a B, KB, MB, or GB
      @param:
          @name: bytes
          @desc: The number of bytes
          @type: number
  */
  format_bytes(bytes) {
    if (bytes > 1024 * 1024 * 1024) {
      return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
    } else if (bytes > 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    } else if (bytes > 1024) {
      return `${(bytes / 1024).toFixed(2)}KB`;
    }
    return `${bytes.toFixed(2)}B`;
  },
  /* @docs:
      @title: CPU usage
      @desc: Get the system cpu usage
      @return:
          Returns a number containing the current cpu usage in percentage
  */
  cpu_usage() {
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
  },
  /* @docs:
      @title: Memory usage
      @desc: Get the system memory usage
      @return:
          Returns a `{total, used, free, used_percentage}` object with memory usage
      @param:
          @name: format
          @desc: Format the bytes into a converted string with a suffixed B, KB, MB, or GB
  */
  memory_usage(format = true) {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;
    return {
      total: format ? System.format_bytes(total) : total,
      used: format ? System.format_bytes(used) : used,
      free: format ? System.format_bytes(free) : free,
      used_percentage: used / total * 100
    };
  },
  /* @docs:
      @title: Network usage
      @desc: Get the system network usage
      @return:
          Returns a `{sent, received}` object with sent and received bytes usage
      @param:
          @name: format
          @desc: Format the bytes into a converted string with a suffixed B, KB, MB, or GB
  */
  async network_usage(format = true) {
    const stats = await sysinfo.networkStats();
    let sent = 0;
    let received = 0;
    stats.forEach((iface) => {
      sent += iface.tx_bytes;
      received += iface.rx_bytes;
    });
    return {
      sent: format ? System.format_bytes(sent) : sent,
      received: format ? System.format_bytes(received) : received
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  System
});
