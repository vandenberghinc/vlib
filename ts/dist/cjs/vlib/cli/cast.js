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
  Cast: () => Cast
});
module.exports = __toCommonJS(stdin_exports);
var import_throw = require("../scheme/throw.js");
var Cast;
(function(Cast2) {
  Cast2.RuntimeTypes = {
    /** @warning Dont add `undefined` since this would clash with `CLI._cast()` detection in error vs success response. */
    /** Primitive types. */
    string: "",
    number: 0,
    boolean: false,
    /**
     * Arrays.
     * Union arrays can be created by passing an array of types, such as `["string", "number"] will become `string[] | number[]`, which can prob be casted to `(string | number)[]` with a wrapper.
     */
    array: [],
    // we only need the keys at runtime
    "boolean[]": [],
    "number[]": [],
    "string[]": [],
    /** Object.s */
    object: {},
    /** Maps. */
    "string:boolean": {},
    "string:number": {},
    "string:string": {},
    "string:boolean|number|string": {},
    "string:boolean|number": {},
    "string:boolean|string": {},
    "string:number|string": {},
    "string:boolean|number|string|array": {},
    "number:boolean": /* @__PURE__ */ new Map(),
    "number:number": /* @__PURE__ */ new Map(),
    "number:string": /* @__PURE__ */ new Map()
  };
  let Type;
  (function(Type2) {
    Type2.valid = new Set(Object.keys(Cast2.RuntimeTypes));
    Type2.is = (key) => Type2.valid.has(key);
    function parse(value, none_type) {
      const type = (0, import_throw.value_type)(value);
      if (Type2.is(type)) {
        return type;
      }
      if (none_type != null) {
        switch (type) {
          case "undefined":
          case "null":
          case "none":
            return none_type;
        }
      }
    }
    Type2.parse = parse;
  })(Type = Cast2.Type || (Cast2.Type = {}));
})(Cast || (Cast = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Cast
});
