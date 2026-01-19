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
  Iterator: () => Iterator,
  Language: () => Language,
  Languages: () => Languages,
  languages: () => languages
});
module.exports = __toCommonJS(stdin_exports);
var import_colors = require("../generic/colors.js");
var import_index_m_web = require("../schema/index.m.web.js");
class Language {
  /** Options. */
  name;
  whitespace;
  inline_whitespace;
  line_terminators;
  string;
  comment;
  regex;
  first_regex_chars;
  /**
   * Has any `string`, `comment` or `regex` options defined.
   */
  has_patterns;
  /** Constructor. */
  constructor(opts) {
    if (typeof opts === "string") {
      const l = Languages[opts];
      if (!l) {
        throw new Error(`Language option '${opts}' is not supported, the following default languages are supported: ${Object.keys(Languages).join(", ")}`);
      }
      this.name = l.name;
      this.whitespace = l.whitespace;
      this.inline_whitespace = l.inline_whitespace;
      this.line_terminators = l.line_terminators;
      this.string = l.string;
      this.comment = l.comment;
      this.regex = l.regex;
      this.first_regex_chars = l.first_regex_chars;
      this.has_patterns = l.has_patterns;
    } else if (opts && typeof opts === "object") {
      this.name = opts.name;
      this.inline_whitespace = new Set(opts.inline_whitespace ?? [" ", "	"]);
      this.line_terminators = new Set(opts.line_terminators ?? ["\n", "\r"]);
      this.whitespace = /* @__PURE__ */ new Set([
        ...this.inline_whitespace,
        ...this.line_terminators
      ]);
      this.string = opts.string ? new Set(opts.string) : void 0;
      this.comment = !opts.comment ? void 0 : {
        line: opts.comment == null ? void 0 : typeof opts.comment?.line === "string" ? { open: opts.comment.line, sol: true } : typeof opts.comment?.line === "object" ? { open: opts.comment?.line?.open, sol: opts.comment?.line?.sol ?? true } : void 0,
        block: opts.comment?.block,
        first_block_chars: Language._first_char_set_from_patterns(opts.comment?.block)
      };
      this.has_patterns = this.string != null || this.comment != null || this.regex != null;
      this.regex = opts.regex;
      this.first_regex_chars = Language._first_char_set_from_patterns(opts.regex);
    } else
      throw TypeError(`Invalid language options: ${opts.toString()}`);
  }
  /**
   * Create a set from the first characters of pattern entries.
   * Can be used to perform a quick lookup if the first character matches any of the patterns.
   */
  static _first_char_set_from_patterns(entries) {
    if (entries == null) {
      return void 0;
    }
    if (Array.isArray(entries[0])) {
      return new Set(
        entries.map((e) => e[0][0]).filter((v, i, a) => a.indexOf(v) === i)
        // drop duplicates
      );
    } else {
      return /* @__PURE__ */ new Set([entries[0][0]]);
    }
  }
}
const iterator_restore_keys = [
  // hot scalars
  "pos",
  "line",
  "col",
  "at_sol",
  "sol_index",
  "char",
  "next",
  "prev",
  "is_whitespace",
  "is_inline_whitespace",
  "is_eol",
  "is_escaped",
  "is_not_escaped",
  "avail",
  "no_avail",
  // less‑hot but harmless
  "lang",
  "end",
  "exclude_comments"
];
class Iterator {
  // --------------------------------------------------------
  // Fixed attributes (or semi) - attributes that can be passed to the constructor.
  // Dont use `?` or `!` to ensure all copies and inits are ok.
  /**
   * The language attributes from the attached iterator.
   * @warning Do not manually change attribute `lang`, use `switch_language()` instead.
   *          Changing the language context while inside a language pattern (string, comment, regex) may cause undefined behaviour.
   */
  lang;
  /** The source file. */
  source;
  /** The end index, defaults to `source.data.length`. */
  end;
  /**
   * Exclude all comments from visitations.
   * When enabled, internally the iterator automatically advances comments. Therefore, the user will never visit a comment.
   * @note That this only guarantees that comments are excluded for the passed state, not when searching forward manually or through a non state callback iterator.
   */
  exclude_comments;
  // --------------------------------------------------------
  // Dynamic state attributes.
  // These are updated during the iteration.
  // Dont use `?` or `!` to ensure all copies and inits are ok.
  /** Current position in the source data */
  pos;
  /** Current line number. */
  line;
  /** Current column number. */
  col;
  /** Current char. */
  char;
  /** Next char. */
  next;
  /** Previous char. */
  prev;
  /** Is at the start of line (excluding whitespace). */
  at_sol;
  /** Start of line index. */
  sol_index;
  /** Flag to indicate if the state still has available data to advance to. */
  avail;
  /** Flag to indicate if the state no longer has any available data to advance to. */
  no_avail;
  /**
   * Is at whitespace, including line terminators.
   * So one of the prodived whitespace or line-terminators chars from the language context.
   **/
  is_whitespace;
  /** Is at inline whitespace, one of the prodived whitespace chars from the language context. */
  is_inline_whitespace;
  /** Is at end of line, one of the prodived line-terminator chars from the language context. */
  is_eol;
  /** Checks if the current char is escaped by previous \.  */
  is_escaped;
  /** checks if the current char is NOT escaped by previous \.  */
  is_not_escaped;
  /** Is a string, only enabled if `CodeIterator.opts.string` is defined. */
  is_str;
  /** Is a comment, only enabled if `CodeIterator.opts.comment` is defined. */
  is_comment;
  /** Is a regex, only enabled if `CodeIterator.opts.regex` is defined. */
  is_regex;
  /** Depth trackings. */
  depth;
  /** Temporary debug system flag. */
  __debug;
  /**
   * @warning Dont add attribute `data` or update the CodeIterator constructor since that requires the state not to have a `data` attribute.
   * @docs
   */
  constructor(state, opts) {
    if (state instanceof Iterator) {
      this.source = state.source;
      this.end = state.end;
      this.lang = state.lang;
      this.exclude_comments = state.exclude_comments;
      this.__debug = state.__debug ?? false;
      this.pos = state.pos;
      this.line = state.line;
      this.col = state.col;
      this.at_sol = state.at_sol;
      this.sol_index = state.sol_index;
      this.is_str = state.is_str ? { ...state.is_str } : void 0;
      this.is_comment = state.is_comment ? { ...state.is_comment } : void 0;
      this.is_regex = state.is_regex ? { ...state.is_regex } : void 0;
      this.depth = { ...state.depth };
      this.char = state.char;
      this.next = state.next;
      this.prev = state.prev;
      this.is_whitespace = state.is_whitespace;
      this.is_inline_whitespace = state.is_inline_whitespace;
      this.is_eol = state.is_eol;
      this.avail = state.avail;
      this.no_avail = state.no_avail;
      this.is_escaped = state.is_escaped;
      this.is_not_escaped = state.is_not_escaped;
      if (opts) {
        if (typeof opts.end === "number")
          this.end = opts.end;
        if (typeof opts.exclude_comments === "boolean")
          this.exclude_comments = opts.exclude_comments;
        if (opts.language) {
          this.lang = opts.language instanceof Language ? opts.language : new Language(opts.language);
        }
      }
    } else {
      if (typeof state === "object" && "data" in state)
        this.source = state;
      else
        throw new TypeError(`Invalid type for state, expected Source or State<S>, got: ${(0, import_index_m_web.value_type)(state)}`);
      this.end = opts?.end ?? this.source.data.length;
      this.lang = opts?.language instanceof Language ? opts.language : new Language(opts?.language ?? {});
      this.exclude_comments = opts?.exclude_comments ?? false;
      this.__debug = opts?.__debug ?? false;
      this.pos = 0;
      this.line = 1;
      this.col = 1;
      this.at_sol = true;
      this.sol_index = 0;
      this.is_str = void 0;
      this.is_comment = void 0;
      this.is_regex = void 0;
      this.depth = {
        parenth: 0,
        bracket: 0,
        brace: 0
        // template: 0,
      };
      this.char = void 0;
      this.next = void 0;
      this.prev = void 0;
      this.is_whitespace = void 0;
      this.is_inline_whitespace = void 0;
      this.is_eol = void 0;
      this.avail = void 0;
      this.no_avail = void 0;
      this.is_escaped = void 0;
      this.is_not_escaped = void 0;
      this.init();
    }
  }
  /** Is code, not string, comment or regex. */
  get is_code() {
    return this.is_str === void 0 && this.is_comment === void 0 && this.is_regex === void 0;
  }
  // --------------------------------------------------------
  // State management methods.
  // Keep the methods that heavily edit the attributes here, such as reset() etc.
  /**
   * Create a (semi-deep) copy clone of all attributes except for the `source` attribute.
   * @docs
   */
  clone() {
    const view = Object.create(Object.getPrototypeOf(this));
    view.source = this.source;
    view.lang = this.lang;
    view.end = this.end;
    view.exclude_comments = this.exclude_comments;
    view.pos = this.pos;
    view.line = this.line;
    view.col = this.col;
    view.at_sol = this.at_sol;
    view.sol_index = this.sol_index;
    view.char = this.char;
    view.next = this.next;
    view.prev = this.prev;
    view.is_whitespace = this.is_whitespace;
    view.is_inline_whitespace = this.is_inline_whitespace;
    view.is_eol = this.is_eol;
    view.is_escaped = this.is_escaped;
    view.is_not_escaped = this.is_not_escaped;
    view.avail = this.avail;
    view.no_avail = this.no_avail;
    view.depth = { ...this.depth };
    if (this.is_str)
      view.is_str = { ...this.is_str };
    if (this.is_comment)
      view.is_comment = { ...this.is_comment };
    if (this.is_regex)
      view.is_regex = { ...this.is_regex };
    return view;
  }
  /**
   * Restore an earlier state.
   * Used to guarantee the `Iterator.state` reference always points to the same state instance.
   * Otherwise it could cause undefined behaviour when the user pulls out the state for processing and later somewhere else assigns to it directly.
   * Performs a shallow copy of the `source` and `lang` attributes.
   * @param opts The state to restore.
   * @returns The current state instance for method chaining.
   * @docs
   */
  restore(it) {
    if (it.source !== this.source) {
      throw new Error("Cannot restore from a different source");
    }
    for (const k of iterator_restore_keys)
      this[k] = it[k];
    this.depth = { ...it.depth };
    this.is_str = it.is_str ? { ...it.is_str } : void 0;
    this.is_comment = it.is_comment ? { ...it.is_comment } : void 0;
    this.is_regex = it.is_regex ? { ...it.is_regex } : void 0;
    return this;
  }
  /**
   * Reset the state to the start of the source data.
   * @returns The current state instance for method chaining.
   * @docs
   */
  reset() {
    this.pos = 0;
    this.line = 1;
    this.col = 1;
    this.at_sol = true;
    this.sol_index = 0;
    this.is_str = void 0;
    this.is_comment = void 0;
    this.is_regex = void 0;
    this.depth = {
      parenth: 0,
      bracket: 0,
      brace: 0
      // template: 0,
    };
    this.init();
    return this;
  }
  /**
   * Assign the state as stopped.
   * Basically assigning the position to the end of the source data.
   * The iterator can choose wether to advance or not.
   * @returns The current state instance for method chaining.
   * @docs
   */
  stop() {
    this.reset();
    this.pos = this.end;
    return this;
  }
  /**
   * Switch language contexts.
   * @returns If the current context is inside a language dependent option
   *          Switching languages while inside a language dependent option (string, comment, regex) is not allowed.
   *          In this case an `string` type error message will be returned.
   *          Upon success the the old language context is returned, which might be undefined.
   * @throws  An error if the string language name is invalid or if the input type is invalid.
   * @param language The new language context to switch to.
   * @param forced Whether to force the language switch, defaults to `false`.
   *               When `true`, the language switch will be performed even if the current state is inside a string, comment or regex literal.
   * @docs
   */
  switch_language(language, forced = false) {
    if ((this.is_str || this.is_comment || this.is_regex) && !forced) {
      return `Cannot switch language while current state is inside a ${this.is_str ? "string" : this.is_comment ? "comment" : "regex"} literal.`;
    }
    const old = this.lang;
    this.lang = language instanceof Language ? language : new Language(language);
    if (this.pos === 0)
      this.init();
    return old;
  }
  // --------------------------------------------------------
  // Advance & init methods.
  // Keep this purely for the init() and advance() methods.
  // So we can keep this organized and separate from the other methods.
  /**
   * Scan opening language patterns.
   * Ensure this is only called when `this.lang && this.is_not_escaped && this.is_code`.
   * The following state attributes must be set for the current position:
   * - `pos`
   * - `char`
   * - `at_sol` - whether the current position is at the start of a line.
   */
  scan_opening_lang_patterns() {
    if (this.lang.has_patterns && this.is_not_escaped) {
      if (this.lang.string?.has(this.char)) {
        if (this.__debug) {
          console.log("DEBUG: detected string start", {
            char: this.char,
            pos: this.pos,
            line_slice: this.source.data.slice(this.sol_index, this.pos + 1)
          });
        }
        this.is_str = { open: this.char, pos: this.pos };
        return;
      } else if (this.lang.comment?.line && (this.at_sol || !this.lang.comment.line.sol) && this.char === this.lang.comment.line.open[0] && this.source.data.startsWith(this.lang.comment.line.open, this.pos)) {
        this.is_comment = { type: "line", open: this.lang.comment?.line.open, pos: 0 };
        return;
      } else if (this.lang.comment?.block && this.lang.comment.first_block_chars?.has(this.char)) {
        for (const [open, close] of this.lang.comment.block) {
          if (open.length === 1 && this.char === open || open.length > 1 && this.source.data.startsWith(open, this.pos)) {
            this.is_comment = { type: "block", open, close, pos: 0 };
            return;
          }
        }
      }
      if (this.lang.regex && this.lang.first_regex_chars?.has(this.char)) {
        for (const [open, close] of this.lang.regex) {
          if (open.length === 1 && this.char === open || open.length > 1 && this.source.data.startsWith(open, this.pos)) {
            this.is_regex = { open, close, pos: 0 };
            return;
          }
        }
      }
    }
  }
  /**
   * Scan closing language patterns.
   * @warning Should only be called when `this.lang.has_patterns`
   */
  scan_closing_lang_patterns() {
    if (this.is_not_escaped && !this.is_code) {
      if (this.is_str && this.is_str.pos !== this.pos && this.char === this.is_str.open) {
        if (this.__debug) {
          console.log("DEBUG: detected string end", {
            char: this.char,
            pos: this.pos,
            line_slice: this.source.data.slice(this.sol_index, this.pos + 1)
          });
        }
        this.is_str = void 0;
        return;
      } else if (this.is_comment && this.is_comment.type === "block") {
        const com = this.is_comment;
        const close = com.close;
        const pos_in_close = com.pos;
        if (this.char === close[pos_in_close]) {
          com.pos++;
          if (com.pos === close.length) {
            this.is_comment = void 0;
            return;
          }
        } else {
          com.pos = this.char === close[0] ? 1 : 0;
        }
      } else if (this.is_regex) {
        const rex = this.is_regex;
        const close = rex.close;
        if (this.char === close[rex.pos]) {
          rex.pos++;
          if (rex.pos === close.length) {
            this.is_regex = void 0;
            return;
          }
        } else {
          rex.pos = this.char === close[0] ? 1 : 0;
        }
      }
    }
  }
  /**
   * Update all auto computed state attributes that are non context dependent.
   * a.k.a they can always be computed for the give position without knowing any of the previous or next context.
   * When combining this with language patterns, ensure its called after the `scan_closing_` and before `scan_opening_` methods.
   */
  set_defaults() {
    this.char = this.source.data[this.pos] ?? "";
    this.next = this.source.data[this.pos + 1] ?? "";
    this.prev = this.source.data[this.pos - 1] ?? "";
    this.avail = this.pos < this.end;
    this.no_avail = this.pos >= this.end;
    this.is_escaped = this.prev !== "\\" ? false : this.is_escaped_at(this.pos);
    this.is_not_escaped = !this.is_escaped;
    this.is_whitespace = false;
    this.is_inline_whitespace = false;
    this.is_eol = false;
    if (this.lang.inline_whitespace.has(this.char)) {
      this.is_inline_whitespace = true;
      this.is_whitespace = true;
    }
    if (this.is_not_escaped && this.lang.line_terminators.has(this.char)) {
      this.is_eol = true;
      this.is_whitespace = true;
      if (this.is_comment?.type === "line") {
        this.is_comment = void 0;
      }
    }
    if (this.is_code) {
      switch (this.char) {
        case "(":
          this.depth.parenth++;
          break;
        case ")":
          if (this.depth.parenth > 0) {
            this.depth.parenth--;
          }
          break;
        case "[":
          this.depth.bracket++;
          break;
        case "]":
          if (this.depth.bracket > 0) {
            this.depth.bracket--;
          }
          break;
        case "{":
          this.depth.brace++;
          break;
        case "}":
          if (this.depth.brace > 0) {
            this.depth.brace--;
          }
          break;
      }
    }
  }
  /**
   * (Re)initialize the auto computed state attributes.
   * @note This method is called automatically inside the constructor.
   *
   * @dev_note
   *      We use separate `advance()` and `init()` methods.
   *      Mainly to ensure we dont assign a value to the the value of the next pos, as is required in advance.
   *      While init() needs to assign for the exact current pos.
   *
   * @docs
   */
  init() {
    let at_sol = this.pos === 0, sol_index = 0;
    if (!at_sol) {
      const src = this.source.data;
      const ws = this.lang.inline_whitespace;
      const eols = this.lang.line_terminators;
      for (let i = this.pos - 1; i >= 0; i--) {
        const c = src[i];
        if (eols.has(c)) {
          if (c === "\r" && src[i + 1] === "\n") {
            sol_index = i + 2;
          } else if (c === "\n" && i > 0 && src[i - 1] === "\r") {
            i--;
            sol_index = i + 2;
          } else {
            sol_index = i + 1;
          }
          at_sol = true;
          break;
        }
        if (ws.has(c))
          continue;
        break;
      }
    }
    if (this.lang.has_patterns && this.is_not_escaped && !this.is_code) {
      this.scan_closing_lang_patterns();
    }
    this.at_sol = at_sol;
    this.sol_index = sol_index;
    this.set_defaults();
    if (this.lang.has_patterns && this.is_not_escaped && this.is_code) {
      this.scan_opening_lang_patterns();
    }
    if (this.exclude_comments && this.is_comment && this.avail) {
      this.consume_comment();
      return;
    }
  }
  /**
   * Advance a single character, tracking state contexts.
   * We can also call this method without actually advancing.
   * Causing a fresh initialization of all automatially derived state attributes.
   *
   * @dev_note
   *      We use separate `advance()` and `init()` methods.
   *      Mainly to ensure we dont assign a value to the the value of the next pos, as is required in advance.
   *      While init() needs to assign for the exact current pos.
   *
   * @docs
   */
  advance() {
    const old_state = {
      // at_sol: this.at_sol,
      // sol_index: this.sol_index,
      is_inline_whitespace: this.is_inline_whitespace,
      is_eol: this.is_eol
    };
    if (this.lang.has_patterns && this.is_not_escaped && !this.is_code) {
      this.scan_closing_lang_patterns();
    }
    if (old_state.is_eol) {
      if (this.char === "\r" && this.next === "\n") {
        this.pos += 2;
      } else {
        this.pos++;
      }
      this.line++;
      this.col = 1;
      this.sol_index = this.pos;
      this.at_sol = true;
    } else {
      this.pos++;
      this.col++;
      if (this.at_sol && !old_state.is_inline_whitespace) {
        this.at_sol = false;
      }
    }
    this.set_defaults();
    if (this.lang.has_patterns && this.is_not_escaped && this.is_code) {
      this.scan_opening_lang_patterns();
    }
    if (this.exclude_comments && this.is_comment && this.avail) {
      this.consume_comment();
    }
  }
  /**
   * Perform a minor system advance on a small clone of the iterator,
   * meant to only advance the iterator while tracking the current `line` and `col` context.
   * @warning Do not pass an `Iterator` instance to parameter `ctx`, since this may cause undefined behaviour.
   * @param ctx The context to advance.
   */
  minor_advance(ctx) {
    const old_char = this.source.data[ctx.pos];
    if (this.lang.line_terminators.has(old_char) && this.is_not_escaped) {
      if (this.char === "\r" && this.next === "\n") {
        this.pos += 2;
      } else {
        this.pos++;
      }
      ctx.line++;
      ctx.col = 1;
      ctx.at_sol = true;
    } else {
      ctx.pos++;
      ctx.col++;
      if (ctx.at_sol && !this.lang.inline_whitespace.has(old_char)) {
        ctx.at_sol = false;
      }
    }
  }
  // --------------------------------------------------------
  // Retrieving characters.
  /**
   * Peek characters at the current position + adjust.
   * @docs
   */
  peek(adjust) {
    return this.source.data[this.pos + adjust] ?? "";
  }
  /**
   * Get a char at at a specific position, does not check indexes.
   * @docs
   */
  at(pos) {
    return this.source.data[pos];
  }
  /**
   * Get a char code at at a specific position, does not check indexes.
   * @returns the character code of the character at the specified position in the source data, or NaN if the position is out of bounds.
   * @docs
   */
  char_code_at(pos) {
    return this.source.data.charCodeAt(pos);
  }
  // --------------------------------------------------------
  // Retrieving locations.
  /**
   * Capture the current location.
   * @docs
   */
  loc() {
    return {
      line: this.line,
      col: this.col,
      pos: this.pos,
      source: this.source
    };
  }
  // --------------------------------------------------------
  // Consuming methods.
  /**
   * Advance a number of positions.
   * @docs
   */
  advance_n(n) {
    while (n--)
      this.advance();
  }
  /**
   * Advance to a given future position.
   * When execution is finished, the position will be set to the given position.
   * @docs
   */
  advance_to(n) {
    if (n < this.pos)
      throw new Error(`Cannot advance to a past position ${n} < ${this.pos}`);
    if (n >= this.end)
      this.stop();
    else
      while (this.avail && this.pos < n)
        this.advance();
  }
  /**
   * Jump to a position.
   * This is mainly used to jump to a position potentially without advancing.
   * When `lang` is defined, we can only jump forward, since we need to call `advance()` to update the language contexts.
   * However, when `lang` is not defined, we can jump to any position without advancing.
   * The `this.pos` will be set to the given position, and the state will be initialized.
   * When `lang` is defined, the position must be greater than or equal to the current position.
   * @throws An error when the position is out of bounds, or when jumping to a past position with a language defined.
   * @docs
   */
  jump_to(n, opts) {
    if (n < 0 || n >= this.end) {
      throw new Error(`Cannot jump to position ${n}, must be between 0 and ${this.end - 1}.`);
    }
    if (this.lang.has_patterns && opts?.advance !== false) {
      if (n < this.pos) {
        throw new Error(`Cannot jump to a past position ${n} < ${this.pos} when language is defined.`);
      }
      this.advance_to(n);
    } else {
      this.pos = n;
      if (opts?.line != null)
        this.line = opts.line;
      if (opts?.col != null)
        this.col = opts.col;
      this.init();
    }
  }
  /**
   * Consume a string match.
   * @docs
   */
  consume_optional(s) {
    if (s.length === 1 && this.char === s || s.length > 0 && this.match_prefix(s)) {
      this.advance_n(s.length);
    }
  }
  /**
   * Consume inline whitespace (excluding line breaks).
   * @docs
   */
  consume_inline_whitespace() {
    while (this.is_inline_whitespace)
      this.advance();
  }
  /**
   * Consume whitespace (including line breaks).
   * @docs
   */
  consume_whitespace() {
    while (this.is_whitespace)
      this.advance();
  }
  /**
   * Consume a single optional end of line char.
   * @docs
   */
  consume_eol() {
    if (this.is_eol)
      this.advance();
  }
  /**
   * Consume one or multiple optional end of line's*.
   * @docs
   */
  consume_eols() {
    while (this.is_eol)
      this.advance();
  }
  /**
   * Consume while.
   * This function breaks without advancing when `fn` returns a false-like value, or when there is no data left.
   * @docs
   */
  consume_while(fn, slice) {
    const start = this.pos;
    while (this.avail && fn(this))
      this.advance();
    if (slice)
      return this.source.data.slice(start, this.pos);
    return void 0;
  }
  /**
   * Consume util, reversed of `consume_while`.
   * Automatically checks `this.avail` and breaks when there is no data left.
   * @docs
   */
  consume_until(fn, slice) {
    return this.consume_while((...args) => !fn(...args), slice);
  }
  /**
   * Consume the entire line till (not including) the end of line.
   * Automatically checks `this.avail` and breaks when there is no data left.
   * @note This does not consume the end of line character.
   * @docs
   */
  consume_line(slice) {
    return this.consume_until((s) => s.is_eol, slice);
  }
  /**
  * Consume a comment at the current location.
  *
  * - Line comments consume until the next line terminator or EOF.
  * - Block comments consume until the matching closing pattern or EOF.
  *
  * @param slice If true, returns the consumed comment content.
  * @returns The consumed comment string when slice is true.
  *
  * @docs
  */
  consume_comment(slice) {
    const start = this.pos;
    if (!this.is_comment) {
      return slice ? "" : void 0;
    }
    if (this.is_comment.type === "line") {
      const end_idx = this.find_next_eol_fast(this.pos);
      if (end_idx === -1) {
        this.stop();
      } else {
        this.pos = end_idx;
        this.init();
      }
    } else {
      const close_pattern = this.is_comment.close;
      const data_str = this.source.data;
      const idx = data_str.indexOf(close_pattern, this.pos);
      if (idx === -1) {
        this.stop();
      } else {
        this.pos = idx + close_pattern.length;
        this.is_comment = void 0;
        this.init();
      }
    }
    return slice ? this.source.data.slice(start, this.pos) : void 0;
  }
  /**
   * Walk the iterator to the end of a file with a visit callback.
   * The iterator will automatically advance to the next position, if the callback has not advanced the iterator.
   * If iteration will stop if the callback returns exactly `false`, not when a falsy value is returned.
   * @returns The current iterator instance for method chaining.
   * @docs
   */
  walk(fn) {
    while (this.avail) {
      const pos = this.pos;
      if (fn(this) === false)
        break;
      if (this.pos === pos)
        this.advance();
    }
    return this;
  }
  // --------------------------------------------------------
  // Iterator methods like the consume, except then non consuming.
  /**
   * Iterate while.
   * This does not consume any data, but the `state` and `it` from the callback are shallow copies.
   * A reached state can be restored using `this.restore(new_state)`.
   * Automatically checks `state.avail` and breaks when there is no data left.
   * @returns The sliced content if `slice` is true, otherwise the cloned iterator, stopped at the matched position or eof.
   *
   * @docs
   */
  while(fn, slice) {
    const state = this.clone();
    const start = state.pos;
    while (state.avail && fn(state))
      state.advance();
    if (slice)
      return state.source.data.slice(start, state.pos);
    return state;
  }
  /**
   * Iterate util, reversed of `while`.
   * This does not consume any data, but the `state` and `it` from the callback are shallow copies.
   * A reached state can be restored using `this.restore(new_state)`.
   * Automatically checks `state.avail` and breaks when there is no data left.
   * @returns The sliced content if `slice` is true, otherwise the cloned iterator, stopped at the matched position or eof.
   *
   * @docs
   */
  until(fn, slice) {
    return this.while((...args) => !fn(...args), slice);
  }
  // --------------------------------------------------------
  // Character checks.
  /**
   * Check if a given index is escaped by a preceding `\\`,
   * accounts for multiple backslashes.
   * @param index The index of the character to check, note that this should not be the index of the `\\` itself.
   * @returns `true` if the character at the index is escaped by its preceding `\\`, `false` otherwise.
   *
   * @docs
   */
  is_escaped_at(index) {
    if (this.source.data[index - 1] !== "\\")
      return false;
    let i = index - 1;
    let backslash_count = 1;
    while (--i >= 0 && this.source.data[i] === "\\")
      backslash_count++;
    return backslash_count % 2 === 1;
  }
  /**
   * Is a linebreak (line terminator), a.k.a is this char one of the provided line terminators chars.
   * @param c The character or index of the character to check.
   * @note Use `this.is_linebreak` to check the char at the current position, instead of this method.
   *
   * @docs
   */
  is_linebreak(c) {
    if (typeof c === "number")
      return this.lang.line_terminators.has(this.source.data[c]);
    return this.lang.line_terminators.has(c);
  }
  /**
   * Is whitespace, so including the line terminators and normal whitespace chars.
   * @param c The character or index of the character to check.
   * @note Use `this.is_whitespace` to check the char at the current position, instead of this method.
   *
   * @docs
   */
  is_whitespace_at(c) {
    if (typeof c === "number")
      c = this.source.data[c];
    return this.lang.whitespace.has(c);
  }
  /**
   * Is whitespace, so only the inline whitespace chars, not the line terminators.
   * @param c The character or index of the character to check.
   * @note Use `this.is_inline_whitespace` to check the char at the current position, instead of this method.
   *
   * @docs
   */
  is_inline_whitespace_at(c) {
    if (typeof c === "number")
      return this.lang.inline_whitespace.has(this.source.data[c]);
    return this.lang.inline_whitespace.has(c);
  }
  /**
   * Is alphanumeric char [a-zA-Z0-9]
   * @param c The character or index of the character to check.
   *
   * @docs
   */
  is_alphanumeric(c = this.char) {
    const code = typeof c === "number" ? this.source.data.charCodeAt(c) : c.charCodeAt(0);
    return code >= 48 && code <= 57 || // 0-9
    (code | 32) >= 97 && (code | 32) <= 122;
  }
  /**
   * Is lowercase char [a-z]
   * @param c The character or index of the character to check.
   *
   * @docs
   */
  is_lowercase(c = this.char) {
    if (typeof c === "number")
      c = this.source.data[c];
    switch (c) {
      case "a":
      case "b":
      case "c":
      case "d":
      case "e":
      case "f":
      case "g":
      case "h":
      case "i":
      case "j":
      case "k":
      case "l":
      case "m":
      case "n":
      case "o":
      case "p":
      case "q":
      case "r":
      case "s":
      case "t":
      case "u":
      case "v":
      case "w":
      case "x":
      case "y":
      case "z":
        return true;
      default:
        return false;
    }
  }
  /**
   * Is uppercase char [A-Z]
   * @param c The character or index of the character to check.
   *
   * @docs
   */
  is_uppercase(c = this.char) {
    if (typeof c === "number")
      c = this.source.data[c];
    switch (c) {
      case "A":
      case "B":
      case "C":
      case "D":
      case "E":
      case "F":
      case "G":
      case "H":
      case "I":
      case "J":
      case "K":
      case "L":
      case "M":
      case "N":
      case "O":
      case "P":
      case "Q":
      case "R":
      case "S":
      case "T":
      case "U":
      case "V":
      case "W":
      case "X":
      case "Y":
      case "Z":
        return true;
      default:
        return false;
    }
  }
  /**
   * Is a numeric char [0-9]
   * @param c The character or index of the character to check.
   *
   * @docs
   */
  is_numeric(c = this.char) {
    if (typeof c === "number")
      c = this.source.data[c];
    switch (c) {
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        return true;
      default:
        return false;
    }
  }
  /**
   * Check whether a character is a JavaScript “word boundary”:
   * i.e. anything _other_ than [A-Za-z0-9_$].
   * Avoids regex for maximum performance.
   * @param c A single-character string or the index of the character.
   *
   * @docs
   */
  is_word_boundary(c = this.char) {
    if (typeof c === "number")
      c = this.source.data[c];
    if (c.length !== 1)
      return true;
    const code = c.charCodeAt(0);
    if (code >= 48 && code <= 57)
      return false;
    if (code >= 65 && code <= 90)
      return false;
    if (code === 95 || code === 36)
      return false;
    if (code >= 97 && code <= 122)
      return false;
    return true;
  }
  // --------------------------------------------------------
  // Substring and regex matching methods.
  /**
   * Starts with check at current position
   *
   * @docs
   */
  match_prefix(s, start = this.pos) {
    return this.source.data.startsWith(s, start);
  }
  /** Cache of “sticky” regexes so we only compile them once */
  _match_reg_cache = /* @__PURE__ */ new WeakMap();
  /**
   * Try to match `re` exactly at `start` (defaults to current pos).
   * @returns the match array (with captures) or undefined.
   *
   * @docs
   */
  match_regex(re, start = this.pos) {
    let sticky = this._match_reg_cache.get(re);
    if (!sticky) {
      const flags = re.flags.includes("y") ? re.flags : re.flags + "y";
      sticky = new RegExp(re.source, flags);
      this._match_reg_cache.set(re, sticky);
    }
    sticky.lastIndex = start;
    return sticky.exec(this.source.data) ?? void 0;
  }
  // --------------------------------------------------------
  // Search methods.
  /**
   * Get the index of the next end of line, or -1 if not found.
   * @param next If set to `1`, returns the next EOL index;
   *             `2` returns the second next EOL; etc.
   *
   * @docs
   */
  find_next_eol(next = 1) {
    if (next < 1) {
      throw new Error(`Invalid next value ${next}, must be greater than 0`);
    }
    const src = this.source;
    let search_pos = this.pos;
    while (next > 0) {
      let idx = -1;
      for (let i = search_pos; i < src.data.length; i++) {
        if (this.lang.line_terminators.has(src.data[i]) && !this.is_escaped_at(i)) {
          idx = i;
          break;
        }
      }
      if (idx === -1)
        return -1;
      next -= 1;
      if (next === 0)
        return idx;
      search_pos = idx + 1;
    }
    return -1;
  }
  /**
   * Find the index of the next end of line, without a `next` option,
   * offering a slight performance boost. Excluding escaped line terminators.
   * @param start The index to start searching from, defaults to `this.pos`.
   * @param end The end index to stop searching at, defaults to the `this.source.data.length`.
   * @returns The index of the next end of line, or -1 if not found.
   *
   * @docs
   */
  find_next_eol_fast(start = this.pos, end = this.source.data.length) {
    const src = this.source;
    const charset = this.lang.line_terminators;
    for (let i = start; i < end; i++) {
      if (charset.has(src.data[i]) && !this.is_escaped_at(i))
        return i;
    }
    return -1;
  }
  /**
   * Find a character.
   * @param fn The function to match the character against, should return true if the character matches.
   * @param end The end index to stop searching at, defaults to the `this.end` attribute. When set to `-1`, it will immediately return `undefined`.
   * @note The state passed to the function is NOT the current state, but a copy of the state at the start index.
   * @returns The found character that matched the function, or undefined if not found.
   * @dev_note For now we dont support a start index, since we would need to jump() a state without knowing the line etc.
   *
   * @docs
   */
  find(fn, end = this.end) {
    if (end === -1) {
      return void 0;
    }
    if (end > this.source.data.length) {
      throw new Error(`Invalid end index ${end}, must be less than or equal to ${this.source.data.length}`);
    }
    const state = this.clone();
    while (state.avail && state.pos < end) {
      if (fn(state)) {
        return state.char;
      }
      state.advance();
    }
    return void 0;
  }
  /**
   * Find a character's index.
   * @param fn The function to match the character against, should return true if the character matches.
   * @param end The end index to stop searching at, defaults to the `this.end` attribute. When set to `-1`, it will immediately return `-1`.
   * @returns The index of the found character that matched the function, or undefined if not found.
   * @dev_note For now we dont support a start index, since we would need to jump() a state without knowing the line etc.
   *
   * @docs
   */
  find_index(fn, end = this.end) {
    if (end === -1) {
      return -1;
    }
    if (end > this.source.data.length) {
      throw new Error(`Invalid end index ${end}, must be less than or equal to ${this.source.data.length}`);
    }
    const state = this.clone();
    while (state.avail && state.pos < end) {
      if (fn(state)) {
        return state.pos;
      }
      state.advance();
    }
    return -1;
  }
  /**
   * Peek at the first character of the next line.
   * @param skip Optionally use a filter to skip over first characters, if the skip function returns true the index will be incremented, till the next end of line is reached.
   * @returns The first character of the next line, or an empty string if there is no next line.
   *
   * @docs
   */
  first_niw_of_next_line() {
    const i = this.find_next_eol_fast(this.pos);
    if (i < 0)
      return "";
    const first = this.incr_on_inline_whitespace(i + 1);
    if (first >= this.end)
      return "";
    return this.source.data[first];
  }
  /**
   * Get the first non whitespace char looking from index `start`, defaults to `this.pos`
   *
   * @docs
   */
  first_non_whitespace(start = this.pos) {
    const i = this.incr_on_whitespace(start);
    return i >= this.end ? void 0 : this.source.data[i];
  }
  /**
   * Get the first non whitespace char looking from index `start`, defaults to `this.pos`
   *
   * @docs
   */
  first_non_inline_whitespace(start = this.pos) {
    const i = this.incr_on_inline_whitespace(start);
    return i >= this.end ? void 0 : this.source.data[i];
  }
  // --------------------------------------------------------
  // Increment and decrement methods.
  /**
   * Increment the index until a non-whitespace char is found, stops if the char at the index is not inline whitespace.
   * @param index The index to start incrementing from.
   * @param end The end index to stop incrementing at, defaults to the `this.end` attribute.
   * @returns The incremented index.
   * @docs
   */
  incr_on_whitespace(index, end) {
    if (end == null)
      end = this.end;
    if (index < 0 || index >= end) {
      return index;
    }
    let c;
    while (index < end && this.lang.whitespace.has(this.source.data[index]))
      ++index;
    return index;
  }
  /**
   * Increment the index until a non-inline-whitespace char is found, stops if the char at the index is not inline whitespace.
   * @param index The index to start incrementing from.
   * @param end The end index to stop incrementing at, defaults to the `this.end` attribute.
   * @returns The incremented index.
   * @docs
   */
  incr_on_inline_whitespace(index, end) {
    if (end == null)
      end = this.end;
    if (index < 0 || index >= end) {
      return index;
    }
    let c;
    while (index < end && this.lang.inline_whitespace.has(this.source.data[index]))
      ++index;
    return index;
  }
  /**
   * Decrement the index until a non-whitespace char is found, stops if the char at the index is not inline whitespace.
   * @param index The index to start decrementing from.
   * @param min_index The minimum index to stop decrementing at.
   * @param plus_1_when_decremented Whether to add 1 to the index if it was decremented.
   * @returns The decremented index.
   * @docs
   */
  decr_on_whitespace(index, min_index, plus_1_when_decremented = false) {
    if (index < 0 || index >= this.end) {
      return index;
    }
    let c;
    const si = index;
    while (index >= min_index && this.lang.whitespace.has(this.source.data[index])) {
      --index;
    }
    if (plus_1_when_decremented && si !== index) {
      index++;
    }
    return index;
  }
  /**
   * Decrement the index until a non-inline-whitespace char is found, stops if the char at the index is not inline whitespace.
   * @param index The index to start decrementing from.
   * @param min_index The minimum index to stop decrementing at.
   * @param plus_1_when_decremented Whether to add 1 to the index if it was decremented.
   * @returns The decremented index.
   * @docs
   */
  decr_on_inline_whitespace(index, min_index, plus_1_when_decremented = false) {
    if (index < 0 || index >= this.end) {
      return index;
    }
    let c;
    const si = index;
    while (index >= min_index && this.lang.inline_whitespace.has(this.source.data[index])) {
      --index;
    }
    if (plus_1_when_decremented && si !== index) {
      index++;
    }
    return index;
  }
  // ----------------------------------------------------------------
  // Slicing methods.
  /**
   * Slice the current line till the current position or till the end of the line without consuming.
   * @docs
   */
  slice_line(opts) {
    const end = opts?.full ? this.find_next_eol_fast(this.pos) : this.pos;
    return end < this.sol_index ? this.source.data.slice(this.sol_index) : this.source.data.slice(this.sol_index, end);
  }
  /**
   * Slice the next line.
   * @docs
   */
  slice_next_line() {
    const i = this.find_next_eol_fast(this.pos);
    return i < 0 ? this.source.data.slice(this.pos) : this.source.data.slice(this.pos, i);
  }
  /**
   * Slice content
   * @docs
   */
  slice(start, end) {
    return this.source.data.slice(start, end);
  }
  // --------------------------------------------------------
  // Debug helpers.
  /**
   * Get debug info about the (minimized) cursor position.
   * @docs
   */
  debug_cursor() {
    return {
      ch: this.char,
      pos: this.pos,
      loc: `${this.line}:${this.col}`,
      ...this.at_sol ? { at_sol: this.at_sol } : {},
      ...this.is_eol ? { is_eol: this.is_eol } : {},
      ...this.is_comment ? { is_comment: this.is_comment } : {},
      ...this.is_str ? { is_str: this.is_str } : {},
      ...this.is_regex ? { is_regex: this.is_regex } : {}
    };
  }
  /**
   * Debug methods
   * @docs
   */
  debug_dump_code(title, code, colored = true) {
    let lines = code.split("\n");
    let plain_lines = lines;
    plain_lines = plain_lines.map((l, i) => `| ${i + 1}: ${l}`);
    lines = lines.map((l, i) => `${import_colors.Color.bold("|")} ${i + 1}: ${import_colors.Color.italic(l)}`);
    plain_lines = [`| ${title}`, ...plain_lines];
    lines = [`${import_colors.Color.bold("|")} ${import_colors.Color.bold(title)}`, ...lines];
    let max = Math.max(...plain_lines.map((l) => l.length));
    plain_lines = plain_lines.map((l) => `${l}${" ".repeat(max - l.length)} |`);
    max = Math.max(...lines.map((l) => l.length));
    lines = lines.map((l) => `${l}${" ".repeat(max - l.length)} ` + import_colors.Color.bold("|"));
    max = Math.max(...plain_lines.map((l) => l.length));
    return import_colors.Color.bold("-".repeat(max)) + "\n" + (colored ? lines : plain_lines).join("\n") + "\n" + import_colors.Color.bold("-".repeat(max));
  }
  // ---------------------------------------------------------------------------
  // Static methods
  /**
   * Split source data into lines.
   * @docs
   */
  static split_lines(source, language) {
    const it = new Iterator(typeof source === "string" ? { data: source } : source, { language });
    const lines = [];
    while (it.avail) {
      const line = it.consume_until((s) => s.is_eol, true);
      if (line)
        lines.push(line);
      it.advance();
    }
    return lines;
  }
}
const Languages = {
  js: new Language({
    name: "js",
    // All valid whitespace, should be valid for all js variants.
    inline_whitespace: [
      // ASCII
      " ",
      "	",
      "\v",
      "\f",
      // Unicode WhiteSpace
      "\xA0",
      "\u1680",
      "\u180E",
      "\u2000",
      "\u2001",
      "\u2002",
      "\u2003",
      "\u2004",
      "\u2005",
      "\u2006",
      "\u2007",
      "\u2008",
      "\u2009",
      "\u200A",
      "\u202F",
      "\u205F",
      "\u3000",
      "\uFEFF"
    ],
    // All valid line terminators, should be valid for all js variants.
    line_terminators: [
      "\n",
      // U+000A – LF
      "\r",
      // U+000D – CR  (handle CRLF as one break)
      "\u2028",
      // U+2028 – LS
      "\u2029",
      // U+2029 – PS
      "\x85"
      // U+0085 – NEL (TypeScript extension – safe to include)
    ],
    string: ["'", '"', "`"],
    comment: {
      line: {
        open: "//",
        sol: false
      },
      block: [["/*", "*/"]]
    }
    // regex: [["/", "/"]],
  }),
  ts: new Language({
    name: "ts",
    // All valid whitespace, should be valid for all ts variants.
    inline_whitespace: [
      // ASCII
      " ",
      "	",
      "\v",
      "\f",
      // Unicode WhiteSpace
      "\xA0",
      "\u1680",
      "\u180E",
      "\u2000",
      "\u2001",
      "\u2002",
      "\u2003",
      "\u2004",
      "\u2005",
      "\u2006",
      "\u2007",
      "\u2008",
      "\u2009",
      "\u200A",
      "\u202F",
      "\u205F",
      "\u3000",
      "\uFEFF"
    ],
    // All valid line terminators, should be valid for all ts variants.
    line_terminators: [
      "\n",
      // U+000A – LF
      "\r",
      // U+000D – CR  (handle CRLF as one break)
      "\u2028",
      // U+2028 – LS
      "\u2029",
      // U+2029 – PS
      "\x85"
      // U+0085 – NEL (TypeScript extension – safe to include)
    ],
    string: ["'", '"', "`"],
    comment: {
      line: {
        open: "//",
        sol: false
      },
      block: [["/*", "*/"]]
    }
    // regex: [["/", "/"]],
  })
  // css: new Language({
  //     name: "css",
  //     string: ["'", '"'],
  //     comment: {
  //         line: undefined,
  //         block: [["/*", "*/"]],
  //     },
  // }),
  // html: new Language({
  //     name: "html",
  //     string: ["'", '"'],
  //     comment: {
  //         block: [["<!--", "-->"]],
  //     },
  // }),
  // json: new Language({
  //     name: "json",
  //     string: new Set(['"']),
  // }),
  // json5: new Language({
  //     name: "json5",
  //     string: ['"'],
  //     comment: {
  //         line: "//",
  //         block: [["/*", "*/"]],
  //     },
  // }),
  // jsonc: new Language({
  //     name: "jsonc",
  //     string: ['"'],
  //     comment: {
  //         line: "//",
  //         block: [["/*", "*/"]],
  //     },
  // }),
  // yaml: new Language({
  //     name: "yaml",
  //     string: ['"'],
  //     comment: {
  //         line: "#",
  //     },
  // }),
  // xml: new Language({
  //     name: "xml",
  //     string: ['"'],
  //     comment: {
  //         block: [["<!--", "-->"]],
  //     },
  // }),
  // md: new Language({
  //     name: "md",
  //     string: ['"'],
  //     comment: {
  //         line: "<!--",
  //     },
  // }),
  // python: new Language({
  //     name: "python",
  //     string: ["'", '"', '`'],
  //     comment: {
  //         line: "#",
  //         block: [["'''", "'''"], ['"""', '"""']],
  //     },
  // }),
  // c: new Language({
  //     name: "c",
  //     string: ["'", '"'],
  //     comment: {
  //         line: "//",
  //         block: [["/*", "*/"]],
  //     },
  // }),
  // cpp: new Language({
  //     name: "cpp",
  //     string: ["'", '"'],
  //     comment: {
  //         line: "//",
  //         block: [["/*", "*/"]],
  //     },
  // }),
  // java: new Language({
  //     name: "java",
  //     string: ["'", '"'],
  //     comment: {
  //         line: "//",
  //         block: [["/*", "*/"]],
  //     },
  // }),
  // php: new Language({
  //     name: "php",
  //     string: ["'", '"', '`'],
  //     comment: {
  //         line: "//",
  //         block: [["/*", "*/"]],
  //     },
  // }),
  // ruby: new Language({
  //     name: "ruby",
  //     string: ["'", '"', '`'],
  //     comment: {
  //         line: "#",
  //         block: [["=begin", "=end"]],
  //     },
  // }),
  // go: new Language({
  //     name: "go",
  //     string: new Set(["'", '"']),
  //     comment: {
  //         line: "//",
  //         block: [["/*", "*/"]],
  //     },
  // }),
  // rust: new Language({
  //     name: "rust",
  //     string: ["'", '"', '`'],
  //     comment: {
  //         line: "//",
  //         block: [["/*", "*/"]],
  //     },
  // }),
  // swift: new Language({
  //     name: "swift",
  //     string: ["'", '"', '`'],
  //     comment: {
  //         line: "//",
  //         block: [["/*", "*/"]],
  //     },
  // }),
  // kotlin: new Language({
  //     name: "kotlin",
  //     string: ["'", '"', '`'],
  //     comment: {
  //         line: "//",
  //         block: [["/*", "*/"]],
  //     },
  // }),
  // shell: new Language({
  //     name: "shell",
  //     string: ["'", '"'],
  //     comment: {
  //         line: "#",
  //         // block: [["<<", "EOF"]],
  //     },
  // }),
  // bash: new Language({
  //     name: "bash",
  //     string: ["'", '"'],
  //     comment: {
  //         line: "#",
  //         // block: [["<<", "EOF"]],
  //     },
  // }),
};
const languages = Languages;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Iterator,
  Language,
  Languages,
  languages
});
