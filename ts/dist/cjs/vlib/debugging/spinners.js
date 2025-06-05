var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  Spinners: () => Spinners,
  spinners: () => Spinners
});
module.exports = __toCommonJS(stdin_exports);
var Spinners;
(function(Spinners2) {
  Spinners2.active = [];
  function has_active() {
    return Spinners2.active.some((spinner) => spinner.running);
  }
  Spinners2.has_active = has_active;
  function add(spinner) {
    Spinners2.active.push(spinner);
  }
  Spinners2.add = add;
  function remove(spinner) {
    const index = Spinners2.active.indexOf(spinner);
    if (index !== -1) {
      Spinners2.active.splice(index, 1);
    }
  }
  Spinners2.remove = remove;
  function pause_all() {
    for (const spinner of Spinners2.active) {
      if (spinner.running) {
        spinner.pause();
      }
    }
  }
  Spinners2.pause_all = pause_all;
  function resume_last() {
    if (Spinners2.active.length > 0) {
      const last_spinner = Spinners2.active[Spinners2.active.length - 1];
      if (!last_spinner.running) {
        last_spinner.resume();
      }
    }
  }
  Spinners2.resume_last = resume_last;
  function ensure_safe_print() {
    if (Spinners2.active.some((spinner) => spinner.running)) {
      clear_current_line();
    }
  }
  Spinners2.ensure_safe_print = ensure_safe_print;
  function clear_current_line() {
    process.stdout.write("\r\x1B[K");
  }
  Spinners2.clear_current_line = clear_current_line;
})(Spinners || (Spinners = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Spinners,
  spinners
});
