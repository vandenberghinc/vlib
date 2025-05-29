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
  Query: () => Query
});
module.exports = __toCommonJS(stdin_exports);
var import_error = require("./error.js");
var Query;
(function(Query2) {
  class And extends Array {
    constructor(...args) {
      super(...args);
    }
    match(fn) {
      return this.every(fn);
    }
  }
  Query2.And = And;
  (function(And2) {
    And2.is = (x) => x instanceof And2;
  })(And = Query2.And || (Query2.And = {}));
  class Or extends Array {
    constructor(...args) {
      super(...args);
    }
    match(fn) {
      return this.some(fn);
    }
  }
  Query2.Or = Or;
  (function(Or2) {
    Or2.is = (x) => x instanceof And === false && Array.isArray(x);
  })(Or = Query2.Or || (Query2.Or = {}));
  Query2.to_str = (id) => id instanceof And ? id.map(Query2.to_str).join(" ") : Array.isArray(id) ? id.map(Query2.to_str).join(", ") : id;
  function match(id, query) {
    if (id instanceof And) {
      return id.every((item, index) => {
        if (typeof query === "string") {
          return match_str(item, query);
        }
        const q = query[index];
        return Array.isArray(q) ? q.includes(item) : match_str(item, q);
      });
    } else if (id instanceof Or || Array.isArray(id)) {
      return id.some((item) => match_str(query, item));
    } else if (typeof id === "string") {
      return match_str(query, id);
    } else {
      (0, import_error.throw_error)(`Invalid query type: ${id.toString()}`);
    }
  }
  Query2.match = match;
  function match_str(id, query) {
    if (id instanceof And) {
      return id.every((i) => i === query);
    } else if (id instanceof Or) {
      return id.includes(query);
    } else if (Array.isArray(id)) {
      return id.includes(query);
    } else if (typeof query === "string") {
      return id === query;
    } else {
      (0, import_error.throw_error)(`Invalid query type: ${query.toString()}`);
    }
  }
  Query2.match_str = match_str;
})(Query || (Query = {}));
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Query
});
