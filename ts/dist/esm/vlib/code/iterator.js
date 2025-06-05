/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Code iterator.
 * Can be used to traverse a code source (semi) context aware.
 * Including optional string, comment, regex etc literal parsing options.
 *
 * Also designed to support nested iterators on nested data while still being able to resolve line & column numbers for the absolute source data.
 * However, this does require the somewhat annoying { source: { data: "..." } } syntax.
 * But this is also required for shallow state copies and so users can add more attributes to source files.
 * @warning Therefore, its imperative we keep the { source: { data: "..." } } syntax. Never change this! Libris might also use this.
 *
 * @note That the iterator state is mutable and is changed during the iteration.
 *
 * @example
 *  For instance lines can safely be split using:
 *  ```ts
 *  const it = new CodeIterator(
 *     { source: { data: "..." } }
 *     { string: ["'", '"', '`'], comment: { line: "//", block: ["/*", "*\/"] } }
 *  });
 *  const lines: string[] = [];
 *  while (!it.is_eof()) {
 *    it.consume_while(c => c !== '\n');
 *    lines.push(it.line());
 *  }
 *  ```
 */
export class Iterator {
    /** The current state. */
    state;
    /** The iterator options, keep it optionally undefined so we can perform a fast check if there are no options defined. */
    config;
    /** Constructor. */
    constructor(
    /** The compiler state. */
    state, 
    /** Options */
    opts, 
    /**
     * Optionally pass a callback and walk the iterator when invoking the constructor.
     * Advancing the iterator inside the callback is allowed.
     */
    callback) {
        this.config = opts;
        this.state = Iterator.State.create(state);
        // If a function is provided, walk the iterator.
        if (callback) {
            while (this.avail()) {
                const pos = this.state.offset;
                callback(this.state, this);
                if (pos === this.state.offset) {
                    this.advance();
                }
            }
        }
    }
    /** Advance a single character, tracking contexts. */
    advance() {
        this.state.advance(this.config);
    }
    /** Advance a number of positions. */
    advance_n(n) { while (n--)
        this.advance(); }
    /**
     * Stop - set the offset to the end of the source data without advancing.
     */
    stop() {
        this.state.stop();
    }
    /** Peek characters/ */
    peek(adjust) { return this.state.source.data[this.state.offset + adjust]; }
    /** Has more content */
    avail() { return this.state.offset < this.state.len; }
    more() { return this.state.offset < this.state.len; }
    has() { return this.state.offset < this.state.len; }
    /** Consume a string match. */
    consume_optional(s) {
        if ((s.length === 1 && this.state.peek === s) || (s.length > 0 && this.state.match_prefix(s))) {
            this.advance_n(s.length);
        }
    }
    /** Consume inline whitespace (excluding line breaks). */
    consume_inline_whitespace() {
        let c;
        while ((c = this.state.peek) === ' ' || c === '\t')
            this.advance();
    }
    /** Consume whitespace (including line breaks). */
    consume_whitespace() {
        let c;
        while ((c = this.state.peek) === ' ' || c === '\t' || c === '\n' || c === '\r')
            this.advance();
    }
    consume_while(fn, slice = false) {
        const start = this.state.offset;
        while (!this.state.is_eof && fn(this.state, this)) {
            this.advance();
        }
        if (slice) {
            return this.state.source.data.slice(start, this.state.offset);
        }
    }
    consume_code_while(fn, slice = false) {
        const info = {
            index: -1,
            peek: "",
            prev: undefined,
            is_str: undefined,
            is_excluded: false,
        };
        const start = this.state.offset;
        while (!this.state.is_eof) {
            if (!fn(this.state, this)) {
                break;
            }
            switch (info.peek) {
                case '"':
                case "'":
                case "`":
                    if (info.is_excluded) {
                        break;
                    }
                    if (info.is_str && info.is_str === info.peek) {
                        info.is_str = undefined;
                    }
                    else if (info.is_str === undefined) {
                        info.is_str = info.peek;
                    }
                    break;
            }
            this.advance();
        }
        if (slice) {
            return this.state.source.data.slice(start, this.state.offset);
        }
    }
    consume_until(fn, slice = false) {
        return this.consume_while((...args) => !fn(...args), slice);
        // const start = this.state.pos;
        // while (!this.is_eof() && !fn(this.state.peek, this.state.pos)) this.advance();
        // if (slice) {
        //     return this.state.data.slice(start, this.state.pos);
        // }
    }
    consume_code_until(fn, slice = false) {
        return this.consume_code_while((...args) => !fn(...args), slice);
    }
    /** Consume until end of line. */
    consume_until_eol() { return this.consume_until(s => s.peek === '\n'); }
    consume_until_eol_slice() { return this.consume_until(s => s.peek === '\n', true); }
    /** Consume optional end of line. */
    skip_eol() { if (this.state.peek === '\n' || this.state.peek === '\r')
        this.advance(); }
    /** Slice the current line till the current offset or till the end of the line without consuming. */
    line(opts) {
        let sof;
        if (opts?.full) {
            sof = this.state.source.data.indexOf('\n', this.state.offset);
        }
        else {
            sof = this.state.offset - (this.state.col - 1);
        }
        if (sof < 0) {
            return this.state.source.data.slice(this.state.offset);
        }
        return this.state.source.data.slice(this.state.offset, sof);
    }
    /** Slice the next line. */
    next_line() { const i = this.state.source.data.indexOf('\n', this.state.offset); return i < 0 ? this.state.source.data.slice(this.state.offset) : this.state.source.data.slice(this.state.offset, i); }
    /** Capture the current location. */
    capture_location() {
        return { line: this.state.line, column: this.state.col, offset: this.state.nested_offset + this.state.offset };
    }
    /** Decrement the index until a non-whitespace char is found. */
    decrement_on_trim(min_index, index, plus_1_when_decrementen = false) {
        let c;
        const si = index;
        while (index >= min_index && ((c = this.state.source.data[index]) === '\n' || c === '\r' || c === ' ' || c === '\t')) {
            --index;
        }
        if (plus_1_when_decrementen && si !== index) {
            index++;
        }
        return index;
    }
    /** Slice content */
    slice(start, end) {
        return this.state.source.data.slice(start, end);
    }
}
/** Code iterator types & static methods. */
(function (Iterator) {
    /**
     * Relative compiler state.
     * Note that the state is mutable and is changed during the iteration.
     */
    class State {
        source;
        abs_source;
        len;
        offset;
        nested_offset;
        line;
        col;
        at_sol;
        sol_index;
        is_str;
        is_comment;
        is_regex;
        depth;
        /** Current char. */
        peek;
        /** Next char. */
        next;
        /** Previous char. */
        prev;
        /** Is whitespace `\s` (including line breaks `\n\r`). */
        is_whitespace;
        /** Is inline whitespace `\s` (excluding line breaks `\n\r`). */
        is_inline_whitespace;
        /** Is at end of line `\n`. */
        is_eol;
        /** Is a line break char `\n\r`. */
        is_line_break;
        /** Is at end of file. */
        is_eof;
        /** checks if the current char is excluded by previous \.  */
        is_excluded;
        /**
         * @warning Dont add attribute `data` or update the CodeIterator constructor since that requires the state not to have a `data` attribute.
         */
        constructor(
        /** The relative source file. */
        source, 
        /** The absolute source file, in case the iterator is part of a parent iterator. Can be used to still resolve line & cols from nested iterations. */
        abs_source, 
        /** Length of the source data */
        len, 
        /** Current relative offset position in the source data */
        offset, 
        /** The nested offset in case `abs_source` is not `source`, can be used to still resolve line & cols from nested iterations. */
        nested_offset, 
        /** Current line number. */
        line, 
        /** Current column number. */
        col, 
        /** Is at the start of line (excluding whitespace). */
        at_sol, 
        /** Start of line index. */
        sol_index, 
        /** Is a string, only enabled if `CodeIterator.opts.string` is defined. */
        is_str, 
        /** Is a comment, only enabled if `CodeIterator.opts.comment` is defined. */
        is_comment, 
        /** Is a regex, only enabled if `CodeIterator.opts.regex` is defined. */
        is_regex, 
        /** Depth trackings. */
        depth) {
            this.source = source;
            this.abs_source = abs_source;
            this.len = len;
            this.offset = offset;
            this.nested_offset = nested_offset;
            this.line = line;
            this.col = col;
            this.at_sol = at_sol;
            this.sol_index = sol_index;
            this.is_str = is_str;
            this.is_comment = is_comment;
            this.is_regex = is_regex;
            this.depth = depth;
            this.update(false);
        }
        /** Construct from source. */
        static create(input) {
            // Initialize the state.
            let s;
            if (typeof input === "string") {
                s = { source: { data: input } };
            }
            else if (typeof input === "object" && "data" in input) {
                s = { source: input, offset: input?.offset ?? 0 };
            }
            else {
                s = input;
            }
            return new State(s.source, s.abs_source ?? s.source, s.source.data.length, s.offset ?? 0, s.nested_offset ?? 0, s.line ?? 1, s.col ?? 1, s.at_sol ?? true, s.sol_index ?? 0, s.is_str ?? undefined, s.is_comment ?? undefined, s.is_regex ?? undefined, {
                parenth: s.depth?.parenth ?? 0,
                bracket: s.depth?.bracket ?? 0,
                brace: s.depth?.brace ?? 0,
                template: s.depth?.template ?? 0,
            });
        }
        /** Is code, not string, comment or regex. */
        get is_code() { return this.is_str === undefined && this.is_comment === undefined && this.is_regex === undefined; }
        /** Get absolute offset. */
        get abs_offset() { return this.nested_offset + this.offset; }
        // --------------------------------------------------------
        // Core methods.
        /**
         * Perform the actual advance and update the state attributes.
         * @note This is used so we can apply a falltrough strategy in the `advance()` method.
         */
        update(incr) {
            if (incr) {
                if (this.is_eol) {
                    // At end of line before incrementing the offset.
                    this.offset++;
                    this.line++;
                    this.col = 1;
                    this.sol_index = this.offset;
                }
                else {
                    // Increment the offset and column.
                    this.offset++;
                    this.col++;
                }
            }
            // Update the peek, next and prev characters.
            this.peek = this.source.data[this.offset];
            this.next = this.source.data[this.offset + 1];
            this.prev = this.source.data[this.offset - 1];
            // Set at start of file.
            if (this.offset === 0) {
                this.at_sol = true;
            }
            else if (this.at_sol && !this.is_inline_whitespace) {
                this.at_sol = false;
            }
            // Set is end of file.
            this.is_eof = this.offset >= this.len;
            // Prev related attributes.
            this.is_excluded = false;
            switch (this.prev) {
                case "\\":
                    this.is_excluded = true;
                    break;
                default:
                    break;
            }
            // Peek related attributes.
            this.is_whitespace = false;
            this.is_inline_whitespace = false;
            this.is_eol = false;
            this.is_line_break = false;
            switch (this.peek) {
                case " ":
                case "\t":
                    this.is_inline_whitespace = true;
                    this.is_whitespace = true;
                    break;
                case "\n":
                    if (!this.is_excluded) {
                        this.is_eol = true;
                        this.is_line_break = true;
                        this.is_whitespace = true;
                        if (this.is_comment?.type === "line") {
                            this.is_comment = undefined;
                        }
                    }
                    break;
                case "\r":
                    if (!this.is_excluded) {
                        this.is_line_break = true;
                        this.is_whitespace = true;
                    }
                    break;
                default: break;
            }
        }
        /**
         * Advance a single character, tracking contexts.
         * @note This method should only apply `opts` related attributes.
         * @note Allows for fallthrough behaviour due to a `update` wrapper.
         */
        advance(opts) {
            const c = this.peek;
            const prev = this.prev;
            // Skips, perform advance directly.
            if (this.is_whitespace) {
                this.update(true);
                return;
            }
            // Depths.
            if (this.is_code) {
                switch (c) {
                    case '(':
                        this.depth.parenth++;
                        break;
                    case ')':
                        this.depth.parenth--;
                        break;
                    case '[':
                        this.depth.bracket++;
                        break;
                    case ']':
                        this.depth.bracket--;
                        break;
                    case '{':
                        this.depth.brace++;
                        break;
                    case '}':
                        this.depth.brace--;
                        break;
                    case '<':
                        this.depth.template++;
                        break;
                    case '>':
                        this.depth.template--;
                        break;
                }
            }
            // When options are enabled.
            if (opts) {
                // inside string
                if (this.is_str) {
                    const delim = this.is_str;
                    // closing?
                    if (c === delim && prev !== '\\') {
                        this.is_str = undefined;
                    }
                    return this.update(true);
                }
                // inside comment
                if (this.is_comment && this.is_comment.type === 'block') {
                    const com = this.is_comment;
                    const close = com.close;
                    const pos_in_close = com.pos;
                    if (c === close[pos_in_close] && prev !== '\\') {
                        com.pos++;
                        if (com.pos === close.length) {
                            this.is_comment = undefined;
                        }
                    }
                    else {
                        com.pos = c === close[0] ? 1 : 0;
                    }
                    return this.update(true);
                }
                // inside regex
                if (this.is_regex) {
                    const rex = this.is_regex;
                    const close = rex.close;
                    const pos_in_close = rex.pos;
                    if (c === close[pos_in_close] && prev !== '\\') {
                        rex.pos++;
                        if (rex.pos === close.length) {
                            this.is_regex = undefined;
                        }
                    }
                    else {
                        rex.pos = c === close[0] ? 1 : 0;
                    }
                    return this.update(true);
                }
                // detect string start
                if (opts.string?.includes(c) && prev !== '\\') {
                    this.is_str = c;
                    return this.update(true);
                }
                // detect line comment
                const line = opts.comment?.line;
                if (line && this.match_prefix(line)) {
                    this.is_comment = { type: 'line', open: line, pos: 0 };
                    return this.update(true);
                }
                // detect block comment
                if (opts.comment?.block) {
                    for (const [open, close] of opts.comment.block) {
                        if ((open.length === 1 && c === open) || (open.length > 1 && this.match_prefix(open))) {
                            this.is_comment = { type: 'block', open, close, pos: 0 };
                            return this.update(true);
                        }
                    }
                }
                // detect regex literal
                if (opts.regex) {
                    for (const [open, close] of opts.regex) {
                        if ((open.length === 1 && c === open) || (open.length > 1 && this.match_prefix(open))) {
                            this.is_regex = { open, close, pos: 0 };
                            return this.update(true);
                        }
                    }
                }
            }
            // Not matched, perform the advance.
            this.update(true);
        }
        /** Create a (semi-deep) copy of all attributes except for the `source` and `abs_source` attributes. */
        copy() {
            return new Iterator.State(this.source, this.abs_source, this.len, this.offset, this.nested_offset, this.line, this.col, this.at_sol, this.sol_index, this.is_str, this.is_comment, this.is_regex, {
                parenth: this.depth.parenth,
                bracket: this.depth.bracket,
                brace: this.depth.brace,
                template: this.depth.template,
            });
        }
        /**
         * Assign the state as stopped.
         * Basically assigning the offset to the end of the source data.
         * The iterator can choose wether to advance or not.
         */
        stop() {
            this.offset = this.len; // set the offset to the end of the source data.
            this.update(false);
        }
        /**
         * Reset the state to the start of the source data.
         */
        reset() {
            this.offset = 0;
            this.line = 1;
            this.col = 1;
            this.at_sol = true;
            this.sol_index = 0;
            this.offset = 0;
            this.line = 1;
            this.col = 1;
            this.at_sol = true;
            this.is_str = undefined;
            this.is_comment = undefined;
            this.is_regex = undefined;
            this.depth = {
                parenth: 0,
                bracket: 0,
                brace: 0,
                template: 0,
            };
            this.update(false);
        }
        // --------------------------------------------------------
        // Utility methods
        /** Cached attribute for `is_variable_char` */
        _is_variable_char;
        /** Is a char allowed in a variable name so [a-zA-Z0-9_] */
        is_variable_char(c) {
            if (this._is_variable_char === undefined) {
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
                    case "_":
                        return this._is_variable_char = true;
                    default:
                        return this._is_variable_char = false;
                }
            }
            return this._is_variable_char;
        }
        /** Starts with check at current position */
        match_prefix(s) { return this.source.data.startsWith(s, this.offset); }
    }
    Iterator.State = State;
    /**
     * Default `Iterator.opts` for common languages.
     */
    Iterator.opts = {
        js: {
            string: ["'", '"', '`'],
            comment: {
                line: "//",
                block: [["/*", "*/"]],
            },
            regex: [["/", "/"]],
        },
        ts: {
            string: ["'", '"', '`'],
            comment: {
                line: "//",
                block: [["/*", "*/"]],
            },
            regex: [["/", "/"]],
        },
        css: {
            string: ["'", '"'],
            comment: {
                line: undefined,
                block: [["/*", "*/"]],
            },
        },
        html: {
            string: ["'", '"'],
            comment: {
                block: [["<!--", "-->"]],
            },
        },
        json: {
            string: ['"'],
        },
        json5: {
            string: ['"'],
            comment: {
                line: "//",
                block: [["/*", "*/"]],
            },
        },
        jsonc: {
            string: ['"'],
            comment: {
                line: "//",
                block: [["/*", "*/"]],
            },
        },
        yaml: {
            string: ['"'],
            comment: {
                line: "#",
            },
        },
        xml: {
            string: ['"'],
            comment: {
                block: [["<!--", "-->"]],
            },
        },
        md: {
            string: ['"'],
            comment: {
                line: "<!--",
            },
        },
        python: {
            string: ["'", '"', '`'],
            comment: {
                line: "#",
                block: [["'''", "'''"], ['"""', '"""']],
            },
        },
        c: {
            string: ["'", '"'],
            comment: {
                line: "//",
                block: [["/*", "*/"]],
            },
        },
        cpp: {
            string: ["'", '"'],
            comment: {
                line: "//",
                block: [["/*", "*/"]],
            },
        },
        java: {
            string: ["'", '"'],
            comment: {
                line: "//",
                block: [["/*", "*/"]],
            },
        },
        php: {
            string: ["'", '"', '`'],
            comment: {
                line: "//",
                block: [["/*", "*/"]],
            },
        },
        ruby: {
            string: ["'", '"', '`'],
            comment: {
                line: "#",
                block: [["=begin", "=end"]],
            },
        },
        go: {
            string: ["'", '"'],
            comment: {
                line: "//",
                block: [["/*", "*/"]],
            },
        },
        rust: {
            string: ["'", '"', '`'],
            comment: {
                line: "//",
                block: [["/*", "*/"]],
            },
        },
        swift: {
            string: ["'", '"', '`'],
            comment: {
                line: "//",
                block: [["/*", "*/"]],
            },
        },
        kotlin: {
            string: ["'", '"', '`'],
            comment: {
                line: "//",
                block: [["/*", "*/"]],
            },
        },
        shell: {
            string: ["'", '"'],
            comment: {
                line: "#",
                // block: [["<<", "EOF"]],
            },
        },
        bash: {
            string: ["'", '"'],
            comment: {
                line: "#",
                // block: [["<<", "EOF"]],
            },
        },
    };
    /**
     * Slice the lines of a source data into lines.
     */
    function slice_lines(source, opts) {
        const it = new Iterator(source, opts);
        const lines = [];
        let line = [];
        while (it.avail()) {
            lines.push(it.consume_until((s) => s.is_code && s.peek === "\n" && s.prev !== "\n", true));
            lines.push(it.line());
            it.advance(); // consume the newline
        }
        return lines;
    }
    Iterator.slice_lines = slice_lines;
    // @todo create this when needed.
    // /**
    //  * Slice the lines of a source file path into lines while reading it in chunks.
    //  * Forwarding the state instance between chunks.
    //  */
    // export function slice_lines_from_file(
    //     path: Path | string,
    // ) { }
})(Iterator || (Iterator = {}));
//# sourceMappingURL=iterator.js.map