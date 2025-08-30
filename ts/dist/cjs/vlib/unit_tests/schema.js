var import_validator_entries = require("../schema/validate/validator_entries.js");
var import_vtest = require("../../vtest/index.js");
var import_index_m_node = require("../schema/index.m.node.js");
const tests = new import_vtest.Module({ name: "vlib/schema" });
function create_error_unit_test(opts) {
  return () => {
    try {
      (0, import_index_m_node.validate)(opts.object, opts);
      return "__NO_ERROR_THROWN__";
    } catch (error) {
      return error.message;
    }
  };
}
function create_success_unit_test(opts) {
  return () => {
    const result = (0, import_index_m_node.validate)(opts.object, opts);
    return JSON.stringify(result);
  };
}
tests.add("scheme_test:1", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    description: "Hello World!"
  },
  schema: {
    name: "string",
    description: "string"
  }
  // Expected error: missing required key "name"
}));
tests.add("scheme_test:2", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    description: "Hello World!",
    name: "Hello Universe!"
  },
  schema: {
    name: "string",
    description: "boolean"
  }
  // Expected error: description type mismatch (string vs boolean)
}));
tests.add("scheme_test:3", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    description: "Hello World!",
    name: false
  },
  value_schema: {
    type: "string"
  }
  // Expected error: root value type mismatch (false not string)
}));
tests.add("scheme_test:4", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    nested: {
      description: "Hello World!",
      name: false
    }
  },
  schema: {
    nested: {
      type: "object",
      value_schema: {
        type: "string"
      }
    }
  }
  // Expected error: nested.value name type mismatch (false not string)
}));
tests.add("scheme_test:5", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    array: [
      {
        description: "Hello World!",
        name: false,
        unknown: "true"
      }
    ]
  },
  schema: {
    array: {
      type: "array",
      value_schema: {
        type: "object",
        schema: {
          name: "string",
          description: "boolean"
        }
      }
    }
  }
  // Expected error: array element description type mismatch (string vs boolean)
}));
tests.add("scheme_test:6", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    posts: {
      my_post: {
        description: "Hello World!",
        name: false,
        unknown: "true"
      }
    }
  },
  schema: {
    posts: {
      type: "object",
      value_schema: {
        type: "object",
        schema: {
          name: "string",
          description: "boolean"
        }
      }
    }
  }
  // Expected error: nested object name type mismatch (false not string)
}));
tests.add("scheme_test:7", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    posts: {
      my_post: {
        description: "Hello World!",
        name: "Hello Universe!",
        unknown: "true"
      }
    }
  },
  schema: {
    posts: {
      type: "object",
      value_schema: {
        type: "object",
        schema: {
          name: "string",
          description: "string"
        }
      }
    }
  }
  // Expected error: unknown key detected under check_unknown
}));
tests.add("scheme_test:8", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    documents: [
      {
        data: "Hello World!",
        name: "Hello Universe!",
        type: "jsx",
        unknown: "true"
      }
    ]
  },
  schema: {
    documents: {
      type: "array",
      value_schema: {
        type: "object",
        schema: {
          name: { type: "string", required: (obj) => obj.data != null },
          data: { type: "string", required: (obj) => obj.stylesheets == null },
          language: { type: "string", required: false },
          stylesheets: { type: "array", required: (obj) => obj.data == null },
          compile: { type: "boolean", def: false },
          type: {
            type: "string",
            enum: ["js", "jsx", "css", "lmx"]
          }
        }
      }
    }
  }
  // Expected error: unknown key in documents object
}));
tests.add("scheme_test:9", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    app_id: void 0,
    client_id: void 0,
    client_secret: void 0,
    private_key: void 0
  },
  schema: {
    app_id: "string",
    client_id: "string",
    client_secret: "string",
    private_key: "string"
  }
  // Expected error: undefined not allowed for string fields
}));
tests.add("scheme_test:10", () => {
  let x = void 0;
  const response = (0, import_index_m_node.validate)({
    // x: undefined,
  }, {
    throw: true,
    unknown: false,
    schema: {
      x: { type: "string", default: "Hello World!" }
    }
  });
  ({ x = "" } = response);
  return x;
});
tests.add("scheme_aliases_population:1", () => {
  const scheme = new import_validator_entries.ValidatorEntries({
    key: { type: "string", alias: ["alias1", "alias2"] }
  });
  const aliases = scheme.aliases;
  const entryInstance = scheme.get("key");
  return aliases.get("alias1") === entryInstance && aliases.get("alias2") === entryInstance;
});
tests.add("scheme_aliases_cached:1", () => {
  const scheme = new import_validator_entries.ValidatorEntries({
    k: { type: "string", alias: ["aliasA"] }
  });
  const firstMap = scheme.aliases;
  const secondMap = scheme.aliases;
  return firstMap === secondMap;
});
tests.add("scheme_verify_simple_string:1", create_success_unit_test({
  throw: true,
  unknown: false,
  object: {
    name: "TestName"
  },
  schema: {
    name: "string"
  }
  // Expected success: returns JSON string with name "TestName"
}));
tests.add("scheme_verify_simple_boolean:1", create_success_unit_test({
  throw: true,
  unknown: false,
  object: {
    flag: true
  },
  schema: {
    flag: "boolean"
  }
  // Expected success: returns JSON string with flag true
}));
tests.add("scheme_verify_missing_optional_no_error:1", create_success_unit_test({
  throw: true,
  unknown: false,
  object: {},
  schema: {
    optional_field: { type: "string", required: false }
  }
  // Expected success: no error, returns {}
}));
tests.add("scheme_verify_default_applied:1", () => {
  const response = (0, import_index_m_node.validate)({}, {
    throw: true,
    unknown: false,
    schema: {
      a: { type: "string", default: "default_val" },
      b: { type: "boolean", default: true }
    }
  });
  return JSON.stringify(response);
});
tests.add("scheme_verify_enum_valid:1", create_success_unit_test({
  throw: true,
  unknown: false,
  object: {
    mode: "jsx"
  },
  schema: {
    mode: {
      type: "string",
      enum: ["js", "jsx", "css"]
    }
  }
  // Expected success: returns JSON string with mode "jsx"
}));
tests.add("scheme_verify_nested_object_valid:1", create_success_unit_test({
  throw: true,
  unknown: false,
  object: {
    nested: {
      x: "hello"
    }
  },
  schema: {
    nested: {
      type: "object",
      value_schema: {
        type: "string"
      }
    }
  }
  // Expected success: returns JSON string with nested.x "hello"
}));
tests.add("scheme_verify_array_of_strings_valid:1", create_success_unit_test({
  throw: true,
  unknown: false,
  object: {
    tags: ["one", "two", "three"]
  },
  schema: {
    tags: {
      type: "array",
      value_schema: {
        type: "string"
      }
    }
  }
  // Expected success: returns JSON string with tags array
}));
tests.add("scheme_verify_object_of_objects_valid:1", create_success_unit_test({
  throw: true,
  unknown: false,
  object: {
    posts: {
      post1: { title: "Hello", published: false },
      post2: { title: "World", published: true }
    }
  },
  schema: {
    posts: {
      type: "object",
      value_schema: {
        type: "object",
        schema: {
          title: "string",
          published: "boolean"
        }
      }
    }
  }
  // Expected success: returns JSON string with posts object
}));
tests.add("scheme_verify_conditional_required_met:1", create_success_unit_test({
  throw: true,
  unknown: false,
  object: {
    data: "some data",
    name: "ProvidedName"
  },
  schema: {
    name: { type: "string", required: (obj) => obj.data != null },
    data: { type: "string", required: false }
  }
  // Expected success: returns JSON string when condition met
}));
tests.add("scheme_verify_conditional_required_not_met:1", create_success_unit_test({
  throw: true,
  unknown: false,
  object: {
    stylesheets: ["s1", "s2"]
  },
  schema: {
    name: { type: "string", required: (obj) => obj.data != null },
    data: { type: "string", required: false },
    stylesheets: { type: "array", required: (obj) => obj.data == null }
  }
  // Expected success: returns JSON string when conditional required not triggered
}));
tests.add("scheme_verify_default_boolean:1", "error", () => {
  const response = (0, import_index_m_node.validate)({
    // 'enabled' missing
    enabled: void 0
  }, {
    throw: true,
    unknown: false,
    schema: {
      enabled: { type: "boolean", default: false }
    }
  });
  return response?.enabled;
});
tests.add("scheme_verify_required_missing:1", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {},
  schema: {
    must: { type: "string", required: true }
  }
  // Expected error: required field missing
}));
tests.add("scheme_verify_type_mismatch_boolean:1", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    flag: 123
  },
  schema: {
    flag: "boolean"
  }
  // Expected error: boolean type mismatch (number given)
}));
tests.add("scheme_verify_type_mismatch_array:1", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    arr: { not: "an array" }
  },
  schema: {
    arr: {
      type: "array",
      value_schema: { type: "string" }
    }
  }
  // Expected error: array expected but got object
}));
tests.add("scheme_verify_array_element_type_error:1", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    arr: ["good", 42, "also good"]
  },
  schema: {
    arr: {
      type: "array",
      value_schema: { type: "string" }
    }
  }
  // Expected error: array element type mismatch (number in string array)
}));
tests.add("scheme_verify_enum_invalid:1", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    mode: "lmx"
    // not in ["js","jsx","css"]
  },
  schema: {
    mode: {
      type: "string",
      enum: ["js", "jsx", "css"]
    }
  }
  // Expected error: enum value invalid
}));
tests.add("scheme_verify_conditional_required_missing:1", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    data: "some data"
    // name missing
  },
  schema: {
    name: { type: "string", required: (obj) => obj.data != null },
    data: { type: "string", required: false }
  }
  // Expected error: conditional required field missing (name)
}));
tests.add("scheme_verify_unknown_key_no_error:1", create_success_unit_test({
  throw: true,
  unknown: true,
  object: {
    known: "yes",
    unknown_extra: 123
  },
  schema: {
    known: "string"
  }
  // Expected success: unknown key ignored
}));
tests.add("scheme_verify_unknown_key_error:1", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    known: "yes",
    unknown_extra: 123
  },
  schema: {
    known: "string"
  }
  // Expected error: unknown key detected
}));
tests.add("scheme_verify_deeply_nested_valid:1", create_success_unit_test({
  throw: true,
  unknown: false,
  object: {
    level1: {
      level2: {
        level3: {
          value: "deep"
        }
      }
    }
  },
  schema: {
    level1: {
      type: "object",
      value_schema: {
        type: "object",
        value_schema: {
          type: "object",
          value_schema: {
            type: "string"
          }
        }
      }
    }
  }
  // Expected success: deep nested value accepts
}));
tests.add("scheme_verify_deeply_nested_error:1", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    level1: {
      level2: {
        level3: {
          value: "deep"
        }
      }
    }
  },
  schema: {
    level1: {
      type: "object",
      value_schema: {
        type: "object",
        value_schema: {
          type: "object",
          value_schema: {
            type: "number"
          }
        }
      }
    }
  }
  // Expected error: deep nested value type mismatch (number vs string)
}));
tests.add("scheme_verify_array_of_object_of_arrays:1", create_success_unit_test({
  throw: true,
  unknown: false,
  object: {
    items: [
      { flags: [true, false, true] },
      { flags: [false, false] }
    ]
  },
  schema: {
    items: {
      type: "array",
      value_schema: {
        type: "object",
        schema: {
          flags: {
            type: "array",
            value_schema: { type: "boolean" }
          }
        }
      }
    }
  }
  // Expected success: nested arrays of booleans accepted
}));
tests.add("scheme_verify_array_of_object_of_arrays_error:1", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    items: [
      { flags: [true, "not boolean", false] }
    ]
  },
  schema: {
    items: {
      type: "array",
      value_schema: {
        type: "object",
        schema: {
          flags: {
            type: "array",
            value_schema: { type: "boolean" }
          }
        }
      }
    }
  }
  // Expected error: nested array element type mismatch ("not boolean" in boolean array)
}));
tests.add("aliases:1", create_success_unit_test({
  throw: true,
  unknown: false,
  object: {
    name_alias: "Daan van den Bergh"
  },
  schema: {
    name: {
      type: "string",
      required: true,
      alias: ["name_alias"]
    }
  }
  // Expected error: missing required key "name"
}));
tests.add("typo_invalid_attr:1", create_error_unit_test({
  throw: true,
  unknown: false,
  object: {
    option: "X"
  },
  schema: {
    options: {
      type: "string",
      required: true
    }
  }
  // Expected error msg like: `Invalid key "option", did you mean "options"`
}));
