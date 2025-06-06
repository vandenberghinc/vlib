"use strict";
var import_vtest = require("../../../vtest/index.js");
var import_object = require("../../minify/object.js");
const tests = new import_vtest.Module({ name: "vlib/minify/object" });
tests.add({
  id: "minify:1",
  expect: "success",
  callback: () => (0, import_object.object)({
    object: {
      hello: "world",
      foo: { bar: "baz", foo: { a: "b", c: "d", e: { f: "g" } }, a: ["a", "b", "c"] },
      not_present: "unchanged"
    },
    flat_scheme: {
      "hello": "h",
      "foo": "f",
      "foo.bar": "b",
      "foo.foo": "f",
      "foo.foo.a": "a",
      "foo.foo.c": "c",
      "foo.foo.e": "e",
      "foo.foo.e.f": "f",
      "foo.a": "a"
    }
  })
});
tests.add({
  id: "minify:2",
  expect: "success",
  callback: () => (0, import_object.object)({
    object: {
      hello: "world",
      foo: { bar: "baz", foo: { a: "b", c: "d", e: { f: "g" } }, a: ["a", "b", "c"] },
      not_present: "unchanged"
    },
    scheme: {
      hello: { key: "h" },
      foo: {
        key: "f",
        scheme: {
          bar: { key: "b" },
          foo: {
            key: "f",
            scheme: {
              a: { key: "a" },
              c: { key: "c" },
              e: { key: "e", scheme: { f: { key: "f" } } }
            }
          },
          a: { key: "a" }
        }
      }
    }
  })
});
const original_obj = {
  hello: "world",
  foo: {
    bar: "baz",
    foo: {
      a: "b",
      c: "d",
      foo: {
        foo: {
          a: "a",
          b: "b",
          c: "c"
        },
        some_attr: "x"
      }
    },
    a: ["a", "b", "c"]
  },
  not_present: "unchanged"
};
const flat_scheme = {
  "hello": "h",
  "foo": "f",
  "foo.bar": "b",
  "foo.foo": "f",
  "foo.foo.a": "a",
  "foo.foo.foo": "f",
  "foo.foo.foo.foo": "f",
  "foo.foo.foo.foo.a": "a",
  "foo.foo.foo.foo.b": "b",
  "foo.foo.foo.foo.c": "c",
  "foo.foo.foo.foo.some_attr": "x",
  "foo.foo.e": "e",
  "foo.foo.e.f": "f",
  "foo.a": "a"
};
tests.add({
  id: "expand:1",
  expect: "success",
  callback: () => {
    const minified = (0, import_object.object)({ object: original_obj, flat_scheme });
    const expanded = import_object.object.expand({ object: minified, flat_scheme });
    return { expanded };
  }
});
const nested_scheme = {
  hello: { key: "h" },
  foo: {
    key: "f",
    scheme: {
      bar: { key: "b" },
      foo: {
        key: "f",
        scheme: {
          a: { key: "a" },
          c: { key: "c" },
          e: {
            key: "e",
            scheme: {
              f: { key: "f" }
            }
          }
        }
      },
      a: { key: "a" }
    }
  }
};
tests.add({
  id: "expand:2",
  expect: "success",
  callback: () => {
    const minified = (0, import_object.object)({ object: original_obj, scheme: nested_scheme });
    const expanded = import_object.object.expand({ object: minified, scheme: nested_scheme });
    return { expanded };
  }
});
