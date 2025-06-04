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
  And: () => And,
  Or: () => Or,
  and: () => and,
  and_or_str: () => and_or_str,
  or: () => or
});
module.exports = __toCommonJS(stdin_exports);
var import_array = require("../global/array.js");
class Or extends Array {
  /** Readonly items for `InferArgs`. */
  items;
  /** Set for `match()`. */
  set;
  /** Constructor. */
  constructor(...items) {
    super(...items);
    this.items = items;
    this.set = new Set(items);
  }
  /** Convert to string. */
  str() {
    and_or_str(this);
  }
  /** Match against argv. */
  match(argv, start_index = 0) {
    if (this.length === 0)
      return void 0;
    const i = argv.findIndex((a) => this.set.has(a), start_index);
    return i === -1 ? void 0 : i;
  }
}
const or = (...args) => new Or(...args);
class And extends Array {
  /** Readonly items for `InferArgs`. */
  items;
  /** Constructor. */
  constructor(...items) {
    super(...items);
    ;
    this.items = items;
  }
  /** Convert to string. */
  str() {
    and_or_str(this);
  }
  /**
   * Match against argv.
   * The sequence must be appear in the exact order as in the array.
   * Without any other args inbetween. So avoid command + arg conflicts.
   */
  match(argv, start_index = 0) {
    if (this.length === 0 || argv.length < this.length)
      return void 0;
    const first = this[0];
    const i = argv.findIndex((a, i2) => a === first && import_array.ArrayUtils.eq(argv, this.items, i2), start_index);
    return i === -1 ? void 0 : i;
  }
}
const and = (...args) => new And(...args);
function and_or_str(id) {
  return typeof id === "string" ? id : id instanceof And ? id.join(" ") : id instanceof Or || Array.isArray(id) ? id.join(", ") : (() => {
    throw new TypeError(`Invalid query identifier: ${id}`);
  })();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  And,
  Or,
  and,
  and_or_str,
  or
});
