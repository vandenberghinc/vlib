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
  filter_output: () => filter_output
});
module.exports = __toCommonJS(stdin_exports);
function filter_output(data, opts) {
  const { include, exclude, visit, drop_undef = false, drop_empty = false } = opts;
  if (include && exclude) {
    throw new Error(`Cannot use both include and exclude options at the same time.`);
  }
  if (data == null || typeof data !== "object") {
    if (typeof visit === "function") {
      return visit(data);
    }
    return data;
  }
  if (!exclude && !include && typeof visit === "function") {
    return visit(data);
  }
  if (Array.isArray(data)) {
    let out = [];
    for (let i = 0; i < data.length; ++i) {
      const l_exclude = exclude;
      const l_include = include;
      const l_visit = visit && typeof visit === "object" ? visit : void 0;
      let res;
      if (l_exclude == null && l_include == null && l_visit == null && !drop_empty && !drop_undef) {
        res = data[i];
      } else {
        res = filter_output(data[i], {
          include: l_include,
          exclude: l_exclude,
          visit: l_visit,
          drop_empty,
          drop_undef
        });
      }
      if (drop_undef && res == null || drop_empty && typeof res !== "number" && !res || drop_empty && typeof res === "object" && Object.keys(res).length === 0) {
        continue;
      }
      out.push(res);
    }
    if (typeof visit === "function") {
      return visit(out);
    }
    return out;
  }
  const obj = data;
  const add_keys = (exclude ? Object.keys(obj).filter((k) => exclude[k] != null && typeof exclude[k] === "object" || !exclude[k]) : include ? Object.keys(include) : Object.keys(obj)).sort((a, b) => a.localeCompare(b));
  const result = {};
  for (const key of add_keys) {
    const l_exclude = !exclude ? void 0 : typeof exclude[key] === "boolean" ? void 0 : exclude[key];
    const l_include = !include ? void 0 : typeof include[key] === "boolean" ? void 0 : include[key];
    const l_visit = visit && typeof visit === "object" ? visit[key] : void 0;
    let res;
    if (l_exclude == null && l_include == null && l_visit == null && !drop_empty && !drop_undef) {
      res = obj[key];
    } else {
      res = filter_output(obj[key], {
        exclude: l_exclude,
        include: l_include,
        visit: l_visit,
        drop_empty,
        drop_undef
      });
    }
    if (drop_undef && res == null || drop_empty && typeof res !== "number" && !res || drop_empty && typeof res === "object" && Object.keys(res).length === 0) {
      continue;
    }
    result[key] = res;
  }
  if (typeof visit === "function") {
    return visit(result);
  }
  return result;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  filter_output
});
