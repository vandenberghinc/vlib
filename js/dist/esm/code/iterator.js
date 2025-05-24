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
export class CodeIterator {
    /** The current state. */
    state;
    /** The iterator options, keep it optionally undefined so we can perform a fast check if there are no options defined. */
    opts;
    /** Constructor. */
    constructor(
    /** The compiler state. */
    state, 
    /** Instantly throw an error when a diagnostic is encountered, useful for debugging. */
    opts, 
    /**
     * Optionally pass a callback and walk the iterator when invoking the constructor.
     * Advancing the iterator inside the callback is allowed.
     */
    callback) {
        // Initialize the state.
        if (typeof state === "string") {
            state = { source: { data: state } };
        }
        else if (typeof state === "object" && "data" in state) {
            state = { source: state };
        }
        this.state = new CodeIterator.State(state.source, state.abs_source ?? state.source, state.source.data.length, state.offset ?? 0, state.nested_offset ?? 0, state.line ?? 1, state.col ?? 1, state.at_sof ?? true, state.is_str ?? undefined, state.is_comment ?? undefined, state.is_regex ?? undefined, {
            parenth: state.depth?.parenth ?? 0,
            bracket: state.depth?.bracket ?? 0,
            brace: state.depth?.brace ?? 0,
            template: state.depth?.template ?? 0,
        });
        // Assign the options.
        this.opts = opts;
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
        const c = this.peek();
        const prev = this.peek_prev();
        // newline
        if (c === '\n' && prev !== '\\') {
            this.state.offset++;
            this.state.line++;
            this.state.col = 1;
            this.state.at_sof = true;
            if (this.state.is_comment?.type === "line") {
                this.state.is_comment = undefined;
            }
            return;
        }
        // clear at_sof on first non-whitespace
        if (this.state.at_sof && !this.is_inline_whitespace()) {
            this.state.at_sof = false;
        }
        // Depths.
        if (this.state.is_code) {
            switch (c) {
                case '(':
                    this.state.depth.parenth++;
                    break;
                case ')':
                    this.state.depth.parenth--;
                    break;
                case '[':
                    this.state.depth.bracket++;
                    break;
                case ']':
                    this.state.depth.bracket--;
                    break;
                case '{':
                    this.state.depth.brace++;
                    break;
                case '}':
                    this.state.depth.brace--;
                    break;
                case '<':
                    this.state.depth.template++;
                    break;
                case '>':
                    this.state.depth.template--;
                    break;
            }
        }
        // When options are enabled.
        if (this.opts) {
            // inside string
            if (this.state.is_str) {
                const delim = this.state.is_str;
                // closing?
                if (c === delim && prev !== '\\') {
                    this.state.is_str = undefined;
                }
                this.state.offset++;
                this.state.col++;
                return;
            }
            // inside comment
            if (this.state.is_comment && this.state.is_comment.type === 'block') {
                const com = this.state.is_comment;
                const close = com.close;
                const pos_in_close = com.pos;
                if (c === close[pos_in_close] && prev !== '\\') {
                    com.pos++;
                    if (com.pos === close.length) {
                        this.state.is_comment = undefined;
                    }
                }
                else {
                    com.pos = c === close[0] ? 1 : 0;
                }
                this.state.offset++;
                this.state.col++;
                return;
            }
            // inside regex
            if (this.state.is_regex) {
                const rex = this.state.is_regex;
                const close = rex.close;
                const pos_in_close = rex.pos;
                if (c === close[pos_in_close] && prev !== '\\') {
                    rex.pos++;
                    if (rex.pos === close.length) {
                        this.state.is_regex = undefined;
                    }
                }
                else {
                    rex.pos = c === close[0] ? 1 : 0;
                }
                this.state.offset++;
                this.state.col++;
                return;
            }
            // detect string start
            if (this.opts.string?.includes(c) && prev !== '\\') {
                this.state.is_str = c;
                this.state.offset++;
                this.state.col++;
                return;
            }
            // detect line comment
            const line = this.opts.comment?.line;
            if (line && this.match_prefix(line)) {
                this.state.is_comment = { type: 'line', open: line, pos: 0 };
                this.state.offset++;
                this.state.col++;
                return;
            }
            // detect block comment
            if (this.opts.comment?.block) {
                for (const [open, close] of this.opts.comment.block) {
                    if ((open.length === 1 && c === open) || (open.length > 1 && this.match_prefix(open))) {
                        this.state.is_comment = { type: 'block', open, close, pos: 0 };
                        this.state.offset++;
                        this.state.col++;
                        return;
                    }
                }
            }
            // detect regex literal
            if (this.opts.regex) {
                for (const [open, close] of this.opts.regex) {
                    if ((open.length === 1 && c === open) || (open.length > 1 && this.match_prefix(open))) {
                        this.state.is_regex = { open, close, pos: 0 };
                        this.state.offset++;
                        this.state.col++;
                        return;
                    }
                }
            }
        }
        // Increment the offset and column.
        this.state.offset++;
        this.state.col++;
    }
    /** Advance a number of positions. */
    advance_n(n) { while (n--)
        this.advance(); }
    /** Peek characters/ */
    peek(adjust = 0) { return this.state.source.data[this.state.offset + adjust]; }
    peek_next() { return this.state.source.data[this.state.offset + 1]; }
    peek_prev() { return this.state.source.data[this.state.offset - 1]; }
    char(adjust = 0) { return this.state.source.data[this.state.offset + adjust]; }
    next() { return this.state.source.data[this.state.offset + 1]; }
    prev() { return this.state.source.data[this.state.offset - 1]; }
    /** Has more content */
    avail() { return this.state.offset < this.state.len; }
    more() { return this.state.offset < this.state.len; }
    has() { return this.state.offset < this.state.len; }
    /** Is inline whitespace (excluding line breaks). */
    is_inline_whitespace() {
        switch (this.peek()) {
            case " ":
            case "\t": return true;
            default: return false;
        }
    }
    /** Is at end of line. */
    is_eol() {
        switch (this.peek()) {
            case "\n":
            case "\r": return true;
            default: return false;
        }
    }
    /** Is at end of file. */
    is_eof() { return this.state.offset >= this.state.len; }
    /** checks if the current char is excluded by previous \.  */
    is_excluded() {
        return this.state.source.data[this.state.offset - 1] === '\\';
    }
    /** Is a char allowed in a variable name so [a-zA-Z0-9_] */
    is_variable_char(c) {
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
                return true;
            default:
                return false;
        }
    }
    /** Starts with check at current position */
    match_prefix(s) { return this.state.source.data.startsWith(s, this.state.offset); }
    /** Consume a string match. */
    consume_optional(s) {
        if ((s.length === 1 && this.peek() === s) || (s.length > 0 && this.match_prefix(s))) {
            this.advance_n(s.length);
        }
    }
    /** Consume inline whitespace (excluding line breaks). */
    consume_inline_whitespace() {
        let c;
        while ((c = this.peek()) === ' ' || c === '\t')
            this.advance();
    }
    /** Consume whitespace (including line breaks). */
    consume_whitespace() {
        let c;
        while ((c = this.peek()) === ' ' || c === '\t' || c === '\n' || c === '\r')
            this.advance();
    }
    consume_while(fn, slice = false) {
        const start = this.state.offset;
        while (!this.is_eof() && fn(this.peek(), this.state.offset)) {
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
        while (!this.is_eof()) {
            info.index = this.state.offset;
            info.peek = this.peek();
            info.prev = this.peek_prev();
            info.is_excluded = info.prev === "\\";
            if (!fn(info)) {
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
        // while (!this.is_eof() && !fn(this.peek(), this.state.pos)) this.advance();
        // if (slice) {
        //     return this.state.data.slice(start, this.state.pos);
        // }
    }
    consume_code_until(fn, slice = false) {
        return this.consume_code_while((...args) => !fn(...args), slice);
    }
    /** Consume until end of line. */
    consume_until_eol() { return this.consume_until(c => c === '\n'); }
    consume_until_eol_slice() { return this.consume_until(c => c === '\n', true); }
    /** Consume optional end of line. */
    skip_eol() { if (this.peek() === '\n' || this.peek() === '\r')
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
/** Code iterator types. */
(function (CodeIterator) {
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
        at_sof;
        is_str;
        is_comment;
        is_regex;
        depth;
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
        at_sof, 
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
            this.at_sof = at_sof;
            this.is_str = is_str;
            this.is_comment = is_comment;
            this.is_regex = is_regex;
            this.depth = depth;
        }
        /** Is code, not string, comment or regex. */
        get is_code() {
            return this.is_str === undefined && this.is_comment === undefined && this.is_regex === undefined;
        }
        /** Get absolute offset. */
        get abs_offset() {
            return this.nested_offset + this.offset;
        }
        /** Create a (semi-deep) copy of all attributes except for the `source` and `abs_source` attributes. */
        copy() {
            return new CodeIterator.State(this.source, this.abs_source, this.len, this.offset, this.nested_offset, this.line, this.col, this.at_sof, this.is_str, this.is_comment, this.is_regex, {
                parenth: this.depth.parenth,
                bracket: this.depth.bracket,
                brace: this.depth.brace,
                template: this.depth.template,
            });
        }
    }
    CodeIterator.State = State;
})(CodeIterator || (CodeIterator = {}));
//# sourceMappingURL=iterator.js.map