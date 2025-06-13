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
  Location: () => Location,
  languages: () => languages
});
module.exports = __toCommonJS(stdin_exports);
var import_colors = require("../generic/colors.js");
var import_index_m_uni = require("../schema/index.m.uni.js");
var Location;
(function(Location2) {
  function advance(loc, num = 1) {
    if (num < 1)
      throw new Error(`Cannot advance location by ${num}, must be at least 1.`);
    const clone = {
      line: loc.line,
      col: loc.col,
      pos: loc.pos,
      source: loc.source
    };
    while (num--) {
      const c = clone.source.data[clone.pos];
      if (c === "\n" && clone.source.data[clone.pos + 1] !== "\\") {
        clone.line++;
        clone.col = 1;
      } else {
        clone.col++;
      }
      clone.pos++;
    }
    return clone;
  }
  Location2.advance = advance;
  function retreat(loc, num = 1) {
    if (num < 1) {
      throw new Error(`Cannot retreat location by ${num}, must be at least 1.`);
    }
    const clone = {
      line: loc.line,
      col: loc.col,
      pos: loc.pos,
      source: loc.source
    };
    while (num--) {
      clone.pos--;
      const c = clone.source.data[clone.pos];
      if (c === "\n" && (clone.pos === 0 || clone.source.data[clone.pos - 1] !== "\\")) {
        clone.line--;
        const prevNl = clone.source.data.lastIndexOf("\n", clone.pos - 1);
        clone.col = prevNl >= 0 ? clone.pos - prevNl : clone.pos + 1;
      } else {
        clone.col--;
      }
    }
    return clone;
  }
  Location2.retreat = retreat;
})(Location || (Location = {}));
class Language {
  /** Options. */
  name;
  string;
  comment;
  regex;
  first_regex_chars;
  /** Constructor. */
  constructor(opts) {
    if (typeof opts === "string") {
      const l = Languages[opts];
      if (!l) {
        throw new Error(`Language option '${opts}' is not supported, the following default languages are supported: ${Object.keys(Languages).join(", ")}`);
      }
      this.name = l.name;
      this.string = l.string;
      this.comment = l.comment;
      this.regex = l.regex;
    } else if (opts && typeof opts === "object") {
      this.name = opts.name;
      this.string = opts.string instanceof Set ? opts.string : opts.string ? new Set(opts.string) : void 0;
      this.comment = {
        ...opts.comment,
        first_block_chars: Language._first_char_set_from_patterns(opts.comment?.block)
      };
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
class Iterator {
  // --------------------------------------------------------
  // Fixed attributes (or semi) - attributes that can be passed to the constructor.
  // Dont use `?` or `!` to ensure all copies and inits are ok.
  /**
   * The language attributes from the attached iterator.
   * Ensure its readonly so we can use the iterator to safely switch languages.
   */
  lang;
  /** The source file. */
  source;
  /** The end index, the iterator emits an `no_avail` when reaching this index, defaults to `source.data.length`. */
  end;
  /**
   * Exclude all comments from visitations.
   * When enabled, internally the iterator automatically advances comments. Therefore, the user will never visit a comment.
   * @note That this only guarantees that comments are excluded for the passed state, not when searching forward manually or through a non state callback iterator.
   */
  exclude_comments;
  /**
   * Locked, advancing is no longer allowed when enabled.
   * Therefore, `advance()` will throw an error when attempting to do so.
   */
  locked;
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
  /** Is whitespace `\s` (including line breaks `\n\r`). */
  is_whitespace;
  /** Is inline whitespace `\s` (excluding line breaks `\n\r`). */
  is_inline_whitespace;
  /** Is at end of line `\n`. */
  is_eol;
  /** Is a line break char `\n\r`. */
  is_line_break;
  /** checks if the current char is escaped by previous \.  */
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
  /**
   * @warning Dont add attribute `data` or update the CodeIterator constructor since that requires the state not to have a `data` attribute.
   */
  constructor(state, opts) {
    if (state instanceof Iterator) {
      this.source = state.source;
      this.end = state.end;
      this.lang = state.lang;
      this.exclude_comments = state.exclude_comments;
      this.locked = state.locked;
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
      this.is_line_break = state.is_line_break;
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
        throw new TypeError(`Invalid type for state, expected Source or State<S>, got: ${(0, import_index_m_uni.value_type)(state)}`);
      this.end = opts?.end ?? this.source.data.length;
      this.lang = opts?.language instanceof Language ? opts.language : opts?.language ? new Language(opts.language) : void 0;
      this.exclude_comments = opts?.exclude_comments ?? false;
      this.locked = false;
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
        brace: 0,
        template: 0
      };
      this.char = void 0;
      this.next = void 0;
      this.prev = void 0;
      this.is_whitespace = void 0;
      this.is_inline_whitespace = void 0;
      this.is_eol = void 0;
      this.is_line_break = void 0;
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
  /** Create a (semi-deep) copy clone of all attributes except for the `source` attribute. */
  clone() {
    return new Iterator(this);
  }
  /**
   * Restore an earlier state.
   * Used to guarantee the `Iterator.state` reference always points to the same state instance.
   * Otherwise it could cause undefined behaviour when the user pulls out the state for processing and later somewhere else assigns to it directly.
   * Performs a shallow copy of the `source` and `lang` attributes.
   * @param opts The state to restore.
   * @returns The current state instance for method chaining.
   */
  restore(opts, copy = true) {
    this.lang = opts.lang;
    this.source = opts.source;
    this.end = opts.end;
    this.locked = opts.locked;
    this.pos = opts.pos;
    this.line = opts.line;
    this.col = opts.col;
    this.at_sol = opts.at_sol;
    this.sol_index = opts.sol_index;
    this.is_str = opts.is_str ? { ...opts.is_str } : void 0;
    this.is_comment = opts.is_comment ? { ...opts.is_comment } : void 0;
    this.is_regex = opts.is_regex ? { ...opts.is_regex } : void 0;
    this.depth = { ...opts.depth };
    this.char = opts.char;
    this.next = opts.next;
    this.prev = opts.prev;
    this.is_whitespace = opts.is_whitespace;
    this.is_inline_whitespace = opts.is_inline_whitespace;
    this.is_eol = opts.is_eol;
    this.is_line_break = opts.is_line_break;
    this.avail = opts.avail;
    this.no_avail = opts.no_avail;
    this.is_escaped = opts.is_escaped;
    this.is_not_escaped = opts.is_not_escaped;
    return this;
  }
  /**
   * Reset the state to the start of the source data.
   * @returns The current state instance for method chaining.
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
      brace: 0,
      template: 0
    };
    this.init();
    return this;
  }
  /**
   * Assign the state as stopped.
   * Basically assigning the position to the end of the source data.
   * The iterator can choose wether to advance or not.
   * @returns The current state instance for method chaining.
   */
  stop() {
    this.reset();
    this.pos = this.end;
    this.locked = true;
    return this;
  }
  /**
   * Switch language contexts.
   * @returns If the current context is inside a language dependent option
   *          Switching languages while inside a language dependent option (string, comment, regex) is not allowed.
   *          In this case an `string` type error message will be returned.
   *          Upon success the the old language context is returned, which might be undefined.
   * @throws  An error if the string language name is invalid or if the input type is invalid.
   */
  switch_language(language) {
    if (this.is_str || this.is_comment || this.is_regex) {
      return "Cannot switch language while current state is inside a string, comment or regex literal.";
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
   * The following state attributes must be set for the current position:
   * - `pos`
   * - `char`
   * - `at_sol` - whether the current position is at the start of a line.
   */
  scan_opening_lang_patterns() {
    if (this.lang.string?.has(this.char)) {
      this.is_str = { open: this.char, pos: this.pos };
    } else if (this.at_sol && this.lang.comment?.line && this.source.data.startsWith(this.lang.comment.line, this.pos)) {
      this.is_comment = { type: "line", open: this.lang.comment?.line, pos: 0 };
    } else if (this.lang.comment?.block && this.lang.comment.first_block_chars?.has(this.char)) {
      for (const [open, close] of this.lang.comment.block) {
        if (open.length === 1 && this.char === open || open.length > 1 && this.source.data.startsWith(open, this.pos)) {
          this.is_comment = { type: "block", open, close, pos: 0 };
          break;
        }
      }
    }
    if (this.lang.regex && this.lang.first_regex_chars?.has(this.char)) {
      for (const [open, close] of this.lang.regex) {
        if (open.length === 1 && this.char === open || open.length > 1 && this.source.data.startsWith(open, this.pos)) {
          this.is_regex = { open, close, pos: 0 };
          break;
        }
      }
    }
  }
  /**
   * Scan closing language patterns.
   * @warning Should only be called when `this.lang && this.is_not_escaped && !this.is_code`
   */
  scan_closing_lang_patterns() {
    if (this.is_str && this.is_str.pos !== this.pos && this.char === this.is_str.open) {
      this.is_str = void 0;
    } else if (this.is_comment && this.is_comment.type === "block") {
      const com = this.is_comment;
      const close = com.close;
      const pos_in_close = com.pos;
      if (this.char === close[pos_in_close]) {
        com.pos++;
        if (com.pos === close.length) {
          this.is_comment = void 0;
        }
      } else {
        com.pos = this.char === close[0] ? 1 : 0;
      }
    } else if (this.is_regex) {
      const rex = this.is_regex;
      const close = rex.close;
      const pos_in_close = rex.pos;
      if (this.char === close[pos_in_close]) {
        rex.pos++;
        if (rex.pos === close.length) {
          this.is_regex = void 0;
        }
      } else {
        rex.pos = this.char === close[0] ? 1 : 0;
      }
    }
  }
  /**
   * Update all auto computed state attributes that are non context dependent.
   * a.k.a they can always be computed for the give position without knowing any of the previous or next context.
   * When combining this with language patterns, ensure its called after the `scan_closing_` and before `scan_opening_` methods.
   */
  set_defaults() {
    this.char = this.source.data[this.pos];
    this.next = this.source.data[this.pos + 1];
    this.prev = this.source.data[this.pos - 1];
    this.avail = this.pos < this.end;
    this.no_avail = this.pos >= this.end;
    this.is_escaped = false;
    this.is_not_escaped = true;
    switch (this.prev) {
      case "\\":
        this.is_escaped = true;
        this.is_not_escaped = false;
        break;
      default:
        break;
    }
    this.is_whitespace = false;
    this.is_inline_whitespace = false;
    this.is_eol = false;
    this.is_line_break = false;
    switch (this.char) {
      case " ":
      case "	":
        this.is_inline_whitespace = true;
        this.is_whitespace = true;
        break;
      case "\n":
        if (this.is_not_escaped) {
          this.is_eol = true;
          this.is_line_break = true;
          this.is_whitespace = true;
          if (this.is_comment?.type === "line") {
            this.is_comment = void 0;
          }
        }
        break;
      case "\r":
        if (this.is_not_escaped) {
          this.is_line_break = true;
          this.is_whitespace = true;
        }
        break;
      default:
        break;
    }
    if (this.is_code) {
      switch (this.char) {
        case "(":
          this.depth.parenth++;
          break;
        case ")":
          this.depth.parenth--;
          break;
        case "[":
          this.depth.bracket++;
          break;
        case "]":
          this.depth.bracket--;
          break;
        case "{":
          this.depth.brace++;
          break;
        case "}":
          this.depth.brace--;
          break;
        case "<":
          this.depth.template++;
          break;
        case ">":
          this.depth.template--;
          break;
      }
    }
  }
  /**
   * Initialize the auto computed state attributes.
   *
   * @dev_note
   *      We use separate `advance()` and `init()` methods.
   *      Mainly to ensure we dont assign a value to the the value of the next pos, as is required in advance.
   *      While init() needs to assign for the exact current pos.
   */
  init() {
    let at_sol = this.pos === 0, sol_index = 0;
    if (!at_sol) {
      for (let i = this.pos; i > 0; i--) {
        switch (this.source.data[i]) {
          case "\n":
            at_sol = true;
            sol_index = i + 1;
            break;
          case " ":
          case "	":
          case "\r":
            continue;
          default:
            break;
        }
        break;
      }
    }
    if (this.lang && this.is_not_escaped && !this.is_code) {
      this.scan_closing_lang_patterns();
    }
    this.at_sol = at_sol;
    this.sol_index = sol_index;
    this.set_defaults();
    if (this.lang && this.is_not_escaped && this.is_code) {
      this.scan_opening_lang_patterns();
    }
    if (this.exclude_comments && this.is_comment && this.avail) {
      this.advance();
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
   */
  advance() {
    if (this.locked) {
      throw new Error("Iterator state is locked, cannot advance.");
    }
    const old_state = {
      // at_sol: this.at_sol,
      // sol_index: this.sol_index,
      is_inline_whitespace: this.is_inline_whitespace,
      is_eol: this.is_eol
    };
    if (this.lang && this.is_not_escaped && !this.is_code) {
      this.scan_closing_lang_patterns();
    }
    if (old_state.is_eol) {
      this.pos++;
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
    if (this.lang && this.is_not_escaped && this.is_code) {
      this.scan_opening_lang_patterns();
    }
    if (this.exclude_comments && this.is_comment && this.avail) {
      this.advance();
    }
  }
  /** Get debug info about the (minimized) cursor position. */
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
  // --------------------------------------------------------
  // Retrieving characters.
  /** Peek characters at the current position + adjust. */
  peek(adjust) {
    return this.source.data[this.pos + adjust];
  }
  /** Get a char at at a specific position, does not check indexes. */
  at(pos) {
    return this.source.data[pos];
  }
  /**
   * Get a char code at at a specific position, does not check indexes.
   * @returns the character code of the character at the specified position in the source data, or NaN if the position is out of bounds.
   */
  char_code_at(pos) {
    return this.source.data.charCodeAt(pos);
  }
  // --------------------------------------------------------
  // Retrieving locations.
  /** Capture the current location. */
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
  /** Advance a number of positions. */
  advance_n(n) {
    while (n--)
      this.advance();
  }
  /**
   * Advance to a given future position.
   * When execution is finished, the position will be set to the given position.
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
   */
  jump_to(n) {
    if (n < 0 || n >= this.end) {
      throw new Error(`Cannot jump to position ${n}, must be between 0 and ${this.end - 1}.`);
    }
    if (this.lang) {
      if (n < this.pos) {
        throw new Error(`Cannot jump to a past position ${n} < ${this.pos} when language is defined.`);
      }
      this.advance_to(n);
    } else {
      this.pos = n;
      this.init();
    }
  }
  /** Consume a string match. */
  consume_optional(s) {
    if (s.length === 1 && this.char === s || s.length > 0 && this.match_prefix(s)) {
      this.advance_n(s.length);
    }
  }
  /** Consume inline whitespace (excluding line breaks). */
  consume_inline_whitespace() {
    while (this.is_inline_whitespace)
      this.advance();
  }
  /** Consume whitespace (including line breaks). */
  consume_whitespace() {
    while (this.is_whitespace)
      this.advance();
  }
  /** Consume a single optional end of line [\n\r]?. */
  consume_eol() {
    if (this.is_line_break)
      this.advance();
  }
  /** Consume one or multiple optional end of line's [\n\r]*. */
  consume_eols() {
    while (this.is_line_break)
      this.advance();
  }
  /**
   * Consume while.
   * This function breaks without advancing when `fn` returns a false-like value, or when there is no data left.
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
   */
  consume_until(fn, slice) {
    return this.consume_while((...args) => !fn(...args), slice);
  }
  /**
   * Consume the entire line till (not including) the end of line.
   * Automatically checks `this.avail` and breaks when there is no data left.
   * @note This does not consume the end of line `\n` character.
   */
  consume_line(slice) {
    return this.consume_until((s) => s.is_eol, slice);
  }
  /** Consume an optional comment at the current location. */
  consume_comment(slice) {
    if (!this.is_comment)
      return slice ? "" : void 0;
    return this.consume_until((it) => !it.is_comment, slice);
  }
  /**
   * Walk the iterator to the end of a file with a visit callback.
   * The iterator will automatically advance to the next position, if the callback has not advanced the iterator.
   * If iteration will stop if the callback returns exactly `false`, not when a falsy value is returned.
   * @returns The current iterator instance for method chaining.
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
   */
  until(fn, slice) {
    return this.while((...args) => !fn(...args), slice);
  }
  // --------------------------------------------------------
  // Character checks.
  /**
   * Is linebreak, charset `[\n\r]`.
   * @param c The character or index of the character to check.
   * @note Use `this.is_linebreak` to check the char at the current position, instead of this method.
   */
  is_linebreak(c) {
    if (typeof c === "number")
      c = this.source.data[c];
    switch (c) {
      case "\n":
      case "\r":
        return true;
      default:
        return false;
    }
  }
  /**
   * Is whitespace, charset `[ \t\n\r]`.
   * @param c The character or index of the character to check.
   * @note Use `this.is_whitespace` to check the char at the current position, instead of this method.
   */
  is_whitespace_at(c) {
    if (typeof c === "number")
      c = this.source.data[c];
    switch (c) {
      case " ":
      case "	":
      case "\n":
      case "\r":
        return true;
      default:
        return false;
    }
  }
  /**
   * Is whitespace, charset `[ \t]`.
   * @param c The character or index of the character to check.
   * @note Use `this.is_inline_whitespace` to check the char at the current position, instead of this method.
   */
  is_inline_whitespace_at(c) {
    if (typeof c === "number")
      c = this.source.data[c];
    switch (c) {
      case " ":
      case "	":
        return true;
      default:
        return false;
    }
  }
  /**
   * Is alphanumeric char [a-zA-Z0-9]
   * @param c The character or index of the character to check.
   */
  is_alphanumeric(c = this.char) {
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
   * Is lowercase char [a-z]
   * @param c The character or index of the character to check.
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
   * Is lowercase char [a-z]
   * @param c The character or index of the character to check.
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
  /** Starts with check at current position */
  match_prefix(s, start = this.pos) {
    return this.source.data.startsWith(s, start);
  }
  /** cache of “sticky” regexes so we only compile them once */
  _match_reg_cache = /* @__PURE__ */ new WeakMap();
  /**
   * Try to match `re` exactly at `start` (defaults to current pos).
   * @returns the match array (with captures) or undefined.
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
   */
  find_next_eol(next = 1) {
    if (next < 1) {
      throw new Error(`Invalid next value ${next}, must be greater than 0`);
    }
    const src = this.source;
    let search_pos = this.pos;
    while (next > 0) {
      const idx = src.data.indexOf("\n", search_pos);
      if (idx === -1)
        return -1;
      if (idx > 0 && src.data[idx - 1] === "\\") {
        search_pos = idx + 1;
        continue;
      }
      next -= 1;
      if (next === 0)
        return idx;
      search_pos = idx + 1;
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
   */
  first_of_next_lineX(skip) {
    let i = this.source.data.indexOf("\n", this.pos);
    if (i < 0) {
      return "";
    }
    ++i;
    if (skip) {
      while (i < this.end && skip(i + 1)) {
        ++i;
      }
    }
    if (i >= this.end) {
      return "";
    }
    return this.source.data[i];
  }
  first_niw_of_next_line() {
    const i = this.source.data.indexOf("\n", this.pos);
    if (i < 0) {
      return "";
    }
    const first = this.incr_on_inline_whitespace(i + 1);
    if (first >= this.end) {
      return "";
    }
    return this.source.data[first];
  }
  /** Get the first non whitespace char looking from index `start`, defaults to `this.pos` */
  first_non_whitespace(start = this.pos) {
    const i = this.incr_on_whitespace(start);
    return i >= this.end ? void 0 : this.source.data[i];
  }
  /** Get the first non whitespace char looking from index `start`, defaults to `this.pos` */
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
   */
  incr_on_whitespace(index, end) {
    if (end == null)
      end = this.end;
    if (index < 0 || index >= end) {
      return index;
    }
    let c;
    while (index < end && ((c = this.source.data[index]) === "\n" || c === "\r" || c === " " || c === "	")) {
      ++index;
    }
    return index;
  }
  incr_on_inline_whitespace(index, end) {
    if (end == null)
      end = this.end;
    if (index < 0 || index >= end) {
      return index;
    }
    let c;
    while (index < end && ((c = this.source.data[index]) === " " || c === "	")) {
      ++index;
    }
    return index;
  }
  /** Decrement the index until a non-whitespace char is found, stops if the char at the index is not inline whitespace. */
  decr_on_whitespace(index, min_index, plus_1_when_decremented = false) {
    if (index < 0 || index >= this.end) {
      return index;
    }
    let c;
    const si = index;
    while (index >= min_index && ((c = this.source.data[index]) === "\n" || c === "\r" || c === " " || c === "	")) {
      --index;
    }
    if (plus_1_when_decremented && si !== index) {
      index++;
    }
    return index;
  }
  decr_on_inline_whitespace(index, min_index, plus_1_when_decremented = false) {
    if (index < 0 || index >= this.end) {
      return index;
    }
    let c;
    const si = index;
    while (index >= min_index && ((c = this.source.data[index]) === " " || c === "	")) {
      --index;
    }
    if (plus_1_when_decremented && si !== index) {
      index++;
    }
    return index;
  }
  // ----------------------------------------------------------------
  // Slicing methods.
  /** Slice the current line till the current position or till the end of the line without consuming. */
  slice_line(opts) {
    const end = opts?.full ? this.source.data.indexOf("\n", this.pos) : this.pos;
    return end < this.sol_index ? this.source.data.slice(this.sol_index) : this.source.data.slice(this.sol_index, end);
  }
  /** Slice the next line. */
  slice_next_line() {
    const i = this.source.data.indexOf("\n", this.pos);
    return i < 0 ? this.source.data.slice(this.pos) : this.source.data.slice(this.pos, i);
  }
  /** Slice content */
  slice(start, end) {
    return this.source.data.slice(start, end);
  }
  // --------------------------------------------------------
  // Debug helpers.
  /** Debug methods */
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
    string: /* @__PURE__ */ new Set(["'", '"', "`"]),
    comment: {
      line: "//",
      block: [["/*", "*/"]]
    },
    regex: [["/", "/"]]
  }),
  ts: new Language({
    name: "ts",
    string: /* @__PURE__ */ new Set(["'", '"', "`"]),
    comment: {
      line: "//",
      block: [["/*", "*/"]]
    },
    regex: [["/", "/"]]
  }),
  css: new Language({
    name: "css",
    string: /* @__PURE__ */ new Set(["'", '"']),
    comment: {
      line: void 0,
      block: [["/*", "*/"]]
    }
  }),
  html: new Language({
    name: "html",
    string: /* @__PURE__ */ new Set(["'", '"']),
    comment: {
      block: [["<!--", "-->"]]
    }
  }),
  json: new Language({
    name: "json",
    string: /* @__PURE__ */ new Set(['"'])
  }),
  json5: new Language({
    name: "json5",
    string: /* @__PURE__ */ new Set(['"']),
    comment: {
      line: "//",
      block: [["/*", "*/"]]
    }
  }),
  jsonc: new Language({
    name: "jsonc",
    string: /* @__PURE__ */ new Set(['"']),
    comment: {
      line: "//",
      block: [["/*", "*/"]]
    }
  }),
  yaml: new Language({
    name: "yaml",
    string: /* @__PURE__ */ new Set(['"']),
    comment: {
      line: "#"
    }
  }),
  xml: new Language({
    name: "xml",
    string: /* @__PURE__ */ new Set(['"']),
    comment: {
      block: [["<!--", "-->"]]
    }
  }),
  md: new Language({
    name: "md",
    string: /* @__PURE__ */ new Set(['"']),
    comment: {
      line: "<!--"
    }
  }),
  python: new Language({
    name: "python",
    string: /* @__PURE__ */ new Set(["'", '"', "`"]),
    comment: {
      line: "#",
      block: [["'''", "'''"], ['"""', '"""']]
    }
  }),
  c: new Language({
    name: "c",
    string: /* @__PURE__ */ new Set(["'", '"']),
    comment: {
      line: "//",
      block: [["/*", "*/"]]
    }
  }),
  cpp: new Language({
    name: "cpp",
    string: /* @__PURE__ */ new Set(["'", '"']),
    comment: {
      line: "//",
      block: [["/*", "*/"]]
    }
  }),
  java: new Language({
    name: "java",
    string: /* @__PURE__ */ new Set(["'", '"']),
    comment: {
      line: "//",
      block: [["/*", "*/"]]
    }
  }),
  php: new Language({
    name: "php",
    string: /* @__PURE__ */ new Set(["'", '"', "`"]),
    comment: {
      line: "//",
      block: [["/*", "*/"]]
    }
  }),
  ruby: new Language({
    name: "ruby",
    string: /* @__PURE__ */ new Set(["'", '"', "`"]),
    comment: {
      line: "#",
      block: [["=begin", "=end"]]
    }
  }),
  go: new Language({
    name: "go",
    string: /* @__PURE__ */ new Set(["'", '"']),
    comment: {
      line: "//",
      block: [["/*", "*/"]]
    }
  }),
  rust: new Language({
    name: "rust",
    string: /* @__PURE__ */ new Set(["'", '"', "`"]),
    comment: {
      line: "//",
      block: [["/*", "*/"]]
    }
  }),
  swift: new Language({
    name: "swift",
    string: /* @__PURE__ */ new Set(["'", '"', "`"]),
    comment: {
      line: "//",
      block: [["/*", "*/"]]
    }
  }),
  kotlin: new Language({
    name: "kotlin",
    string: /* @__PURE__ */ new Set(["'", '"', "`"]),
    comment: {
      line: "//",
      block: [["/*", "*/"]]
    }
  }),
  shell: new Language({
    name: "shell",
    string: /* @__PURE__ */ new Set(["'", '"']),
    comment: {
      line: "#"
      // block: [["<<", "EOF"]],
    }
  }),
  bash: new Language({
    name: "bash",
    string: /* @__PURE__ */ new Set(["'", '"']),
    comment: {
      line: "#"
      // block: [["<<", "EOF"]],
    }
  })
};
const languages = Languages;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Iterator,
  Language,
  Languages,
  Location,
  languages
});
