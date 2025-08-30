/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import { Color } from "../generic/colors.js";
import { value_type } from "../schema/index.m.node.js";

/**
 * We use a source file for the iterator state so we can perform shallow copies of states.
 * Without copying the entire data string.
 */
export interface Source {
    /** The data string. */
    readonly data: string;
}

/**
 * Iterator location interface.
 */
export type Location<
    WithSource extends boolean = boolean, 
    Src extends Source = Source
> = {
    /** Line number (1 based). */
    readonly line: number;
    /** Column number (1 based). */
    readonly col: number;
    /** Absolute position in the absolute source data. */
    readonly pos: number;
} & (
    WithSource extends true
    ? { source: Src; }
    : WithSource extends false 
        ? { source?: never; }
        : never
)

// /** Location types. */
// export namespace Location {

//     /**
//      * Advance a captures location, does not edit the state.
//      * @returns An advanced copy of the current location.
//      */
//     export function advance(
//         loc: Location<true>,
//         num: number = 1,
//     ): Location<true> {
//         if (num < 1) throw new Error(`Cannot advance location by ${num}, must be at least 1.`);
//         const clone: Location<true> = {
//             line: loc.line,
//             col: loc.col,
//             pos: loc.pos,
//             source: loc.source,
//         };
//         while (num--) {
//             const c = clone.source.data[clone.pos];
//             if (c === "\n" && clone.source.data[clone.pos + 1] !== "\\") {
//                 clone.line++;
//                 clone.col = 1;
//             } else {
//                 clone.col++;
//             }
//             clone.pos++;
//         }
//         return clone;
//     }

//     /**
//      * Retreat a captured location by `num` characters, does not edit the state.
//      * @returns A new Location moved backwards by `num` chars.
//      */
//     export function retreat(
//         loc: Location<true>,
//         num: number = 1,
//     ): Location<true> {
//         if (num < 1) {
//             throw new Error(`Cannot retreat location by ${num}, must be at least 1.`);
//         }
//         const clone: Location<true> = {
//             line: loc.line,
//             col: loc.col,
//             pos: loc.pos,
//             source: loc.source,
//         };
//         while (num--) {
//             // step pos back first
//             clone.pos--;
//             const c = clone.source.data[clone.pos];
//             // if we just crossed a real newline (not an escaped "\n"), move up a line
//             if (c === "\n" && (clone.pos === 0 || clone.source.data[clone.pos - 1] !== "\\")) {
//                 clone.line--;
//                 // recalculate col as distance from previous NL (or start of file)
//                 const prevNl = clone.source.data.lastIndexOf("\n", clone.pos - 1);
//                 clone.col = prevNl >= 0
//                     ? clone.pos - prevNl
//                     : clone.pos + 1;
//             } else {
//                 // normal char, just back up a column
//                 clone.col--;
//             }
//         }
//         return clone;
//     }
// }

/**
 * The iterator language options.
 */
export class Language {

    /** Options. */
    readonly name: undefined | string;
    readonly whitespace: Set<string>;
    readonly inline_whitespace: Set<string>;
    readonly line_terminators: Set<string>;
    readonly string: undefined | Set<string>;
    readonly comment: undefined | {
        readonly line?: {
            readonly open: string;
            readonly sol?: boolean;
        };
        readonly block?: [string, string] | [string, string][];
        /** A set of the unique first chars of each block pattern. */
        readonly first_block_chars?: Set<string>
    }
    readonly regex: undefined | [string, string] | [string, string][];
    readonly first_regex_chars: undefined | Set<string>

    /**
     * Has any `string`, `comment` or `regex` options defined.
     */
    readonly has_patterns: boolean;

    /** Constructor. */
    constructor(opts: DefaultLanguageName | {
        /** An optional name that can be used as identifier. */
        name?: string,
        /** The inline white-space characters, defaults to `[" ", "\t"]`, excluding line terminator characters. */
        inline_whitespace?: string[],
        /**
         * The line-terminator characters, defaults to `["\n", "\r"]`
         * Note that when `\r` is present, a subsequent `\r\n` will always be treated as a single line-terminator.
         */
        line_terminators?: string[],
        /** String literal options. */
        string?: string[],
        /** Comment options. */
        comment?: {
            /** Single line comment, is only matched at the start of a line. */
            line?: string | {
                /** The opening pattern. */
                open: string;
                /**
                 * Whether the line comment is only matched at the start of a line.
                 * Defaults to `true`, also when the `comment.line` is a string.
                 */
                sol?: boolean;
            };
            /** Block comment patterns `[open, close]`. */
            block?: [string, string] | [string, string][];
        },
        /** Regex literals. */
        regex?: [string, string] | [string, string][];
    }) {
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
            this.inline_whitespace = new Set(opts.inline_whitespace ?? [" ", "\t"]);
            this.line_terminators = new Set(opts.line_terminators ?? ["\n", "\r"]);
            this.whitespace = new Set([
                ...this.inline_whitespace,
                ...this.line_terminators,
            ]);
            this.string = opts.string
                ? new Set(opts.string)
                : undefined;
            this.comment = !opts.comment ? undefined : {
                line: 
                    opts.comment == null ? undefined :
                    typeof opts.comment?.line === "string" ? { open: opts.comment.line, sol: true } :
                    typeof opts.comment?.line === "object" ? { open: opts.comment?.line?.open, sol: opts.comment?.line?.sol ?? true } :
                    undefined,
                block: opts.comment?.block,
                first_block_chars: Language._first_char_set_from_patterns(opts.comment?.block)
            };
            this.has_patterns = this.string != null || this.comment != null || this.regex != null;
            this.regex = opts.regex;
            this.first_regex_chars = Language._first_char_set_from_patterns(opts.regex);
        }
        // @ts-expect-error
        else throw TypeError(`Invalid language options: ${opts.toString()}`);
    }

    /**
     * Create a set from the first characters of pattern entries.
     * Can be used to perform a quick lookup if the first character matches any of the patterns.
     */
    private static _first_char_set_from_patterns(
        entries: undefined | [string, string] | [string, string][]
    ): undefined | Set<string> {
        if (entries == null) { return undefined; }
        if (Array.isArray(entries[0])) {
            return new Set(
                entries.map((e) => e[0][0])
                .filter((v, i, a) => a.indexOf(v) === i) // drop duplicates
            );
        } else {
            return new Set([entries[0][0]]);
        }
    }

}
export namespace Language { 
    export type Opts = ConstructorParameters<typeof Language>[0];
}

/**
 * The code iterator can be used to traverse a code source (semi) context aware.
 * Including optional string, comment, regex etc literal parsing options.
 * 
 * The iterator acts as a state through the iteration.
 * The state is mutable and changed during the iteration.
 * 
 * @example
 *  For instance `Iterator.split_lines` splits the source data as follows:
 *  ```ts
 *  const it = new Iterator(
 *     { data: "..." }
 *  });
 *  const lines: string[] = [];
 *  while (it.avail) {
 *      const line = it.consume_until((s) => s.is_eol, true);
 *      if (line) lines.push(line); // skip empty lines.
 *      it.advance(); // consume the end of line
 *  }
 *  ```
 */
export class Iterator<Src extends Source = Source> {

    // --------------------------------------------------------
    // Fixed attributes (or semi) - attributes that can be passed to the constructor.
    // Dont use `?` or `!` to ensure all copies and inits are ok.

    /**
     * The language attributes from the attached iterator.
     * Ensure its private so we can manage the switch of language contexts safely.
     */
    private lang: Language;

    /** The source file. */
    readonly source: Src;

    /** The end index, defaults to `source.data.length`. */
    end: number;

    /**
     * Exclude all comments from visitations.
     * When enabled, internally the iterator automatically advances comments. Therefore, the user will never visit a comment.
     * @note That this only guarantees that comments are excluded for the passed state, not when searching forward manually or through a non state callback iterator.
     */
    exclude_comments: boolean;

    // --------------------------------------------------------
    // Dynamic state attributes.
    // These are updated during the iteration.
    // Dont use `?` or `!` to ensure all copies and inits are ok.

    /** Current position in the source data */
    pos: number;
    
    /** Current line number. */
    line: number;
    
    /** Current column number. */
    col: number;

    /** Current char. */
    char: string | "";

    /** Next char. */
    next: string | "";

    /** Previous char. */
    prev: string | "";

    /** Is at the start of line (excluding whitespace). */
    at_sol: boolean;

    /** Start of line index. */
    sol_index: number;

    /** Flag to indicate if the state still has available data to advance to. */
    avail: boolean;

    /** Flag to indicate if the state no longer has any available data to advance to. */
    no_avail: boolean;

    /**
     * Is at whitespace, including line terminators.
     * So one of the prodived whitespace or line-terminators chars from the language context.
     **/
    is_whitespace: boolean;

    /** Is at inline whitespace, one of the prodived whitespace chars from the language context. */
    is_inline_whitespace: boolean;

    /** Is at end of line, one of the prodived line-terminator chars from the language context. */
    is_eol: boolean;

    /** Checks if the current char is escaped by previous \.  */
    is_escaped: boolean;

    /** checks if the current char is NOT escaped by previous \.  */
    is_not_escaped: boolean;

    /** Is a string, only enabled if `CodeIterator.opts.string` is defined. */
    is_str: undefined | Iterator.IsStr;

    /** Is a comment, only enabled if `CodeIterator.opts.comment` is defined. */
    is_comment: undefined | Iterator.IsComment;

    /** Is a regex, only enabled if `CodeIterator.opts.regex` is defined. */
    is_regex: undefined | Iterator.IsRegex;

    /** Depth trackings. */
    depth: Iterator.Depth;

    /**d
     * @warning Dont add attribute `data` or update the CodeIterator constructor since that requires the state not to have a `data` attribute.
     */
    constructor(
        /**
         * Initialize through a source object.
         * Or by a state object, which, performs a deep copy of the state and a shallow copy of the `source` and `lang` attributes.
         */
        state: Src | Iterator<Src>,
        /**
         * Provide additional options.
         * Options provided will always precede the attributes from `state`.
         */
        opts?: {
            /** Assign or override the `end` index, defaults to `source.data.length` */
            end?: number,
            /** The language options. */
            language?: Language | Language.Opts | DefaultLanguageName,
            /**
             * Exclude all comments from visitations.
             * When enabled, internally the iterator automatically advances comments. Therefore, the user will never visit a comment.
             * @note That this only guarantees that comments are excluded for the passed state, not when searching forward manually or through a non state callback iterator, or when slicing data.
             */
            exclude_comments?: boolean,
        },
    ) {

        // Initialize by state.
        // Performs a deep copy of the state and a shallow copy of the `source` attribute.
        if (state instanceof Iterator) {
            
            // Fixed attributes.
            this.source = state.source; // shallow
            this.end = state.end;
            this.lang = state.lang; // shallow
            this.exclude_comments = state.exclude_comments;
            
            // Dynamic attributes.
            this.pos = state.pos;
            this.line = state.line;
            this.col = state.col;
            this.at_sol = state.at_sol;
            this.sol_index = state.sol_index;
            this.is_str = state.is_str ? { ...state.is_str } : undefined;
            this.is_comment = state.is_comment ? { ...state.is_comment } : undefined;
            this.is_regex = state.is_regex ? { ...state.is_regex } : undefined;
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
            // no need to call init() also saves a bit of performance.

            // Override from opts.
            if (opts) {
                if (typeof opts.end === "number") this.end = opts.end;
                if (typeof opts.exclude_comments === "boolean") this.exclude_comments = opts.exclude_comments;
                if (opts.language) {
                    this.lang = opts.language instanceof Language
                        ? opts.language
                        : new Language(opts.language)
                }
            }
        }
        else {

            // Fixed attributes.
            if (typeof state === "object" && "data" in state) this.source = state as Src;
            else throw new TypeError(`Invalid type for state, expected Source or State<S>, got: ${value_type(state)}`);
            this.end = opts?.end ?? this.source.data.length;
            this.lang = opts?.language instanceof Language
                ? opts.language
                : new Language(opts?.language ?? {})
            this.exclude_comments = opts?.exclude_comments ?? false;

            // Dynamic attributes.
            this.pos = 0;
            this.line = 1;
            this.col = 1;
            this.at_sol = true;
            this.sol_index = 0;
            this.is_str = undefined;
            this.is_comment = undefined;
            this.is_regex = undefined;
            this.depth = {
                parenth: 0,
                bracket: 0,
                brace: 0,
                // template: 0,
            };
            // dummy for auto init attrs, let init() do the work.
            this.char = undefined as never;
            this.next = undefined as never;
            this.prev = undefined as never;
            this.is_whitespace = undefined as never;
            this.is_inline_whitespace = undefined as never;
            this.is_eol = undefined as never;
            this.avail = undefined as never;
            this.no_avail = undefined as never;
            this.is_escaped = undefined as never;
            this.is_not_escaped = undefined as never;
            this.init(); 
        }
    }

    /** Is code, not string, comment or regex. */
    get is_code(): boolean { return this.is_str === undefined && this.is_comment === undefined && this.is_regex === undefined }

    // --------------------------------------------------------
    // State management methods.
    // Keep the methods that heavily edit the attributes here, such as reset() etc.

    /** Create a (semi-deep) copy clone of all attributes except for the `source` attribute. */
    clone(): Iterator<Src> { return new Iterator<Src>(this); }

    /**
     * Restore an earlier state.
     * Used to guarantee the `Iterator.state` reference always points to the same state instance.
     * Otherwise it could cause undefined behaviour when the user pulls out the state for processing and later somewhere else assigns to it directly.
     * Performs a shallow copy of the `source` and `lang` attributes.
     * @param opts The state to restore.
     * @returns The current state instance for method chaining.
     */
    restore(opts: Iterator<Src>, copy: boolean = true): this {
        /** @warning Dont forget to update `restore()` as well when changing this. */
        // special.
        this.lang = opts.lang; // shallow
        if (opts.source !== this.source) {
            throw new Error("Cannot restore from a different source");
        }
        this.end = opts.end;
        // others.
        this.pos = opts.pos;
        this.line = opts.line;
        this.col = opts.col;
        this.at_sol = opts.at_sol;
        this.sol_index = opts.sol_index;
        this.is_str = opts.is_str ? { ...opts.is_str } : undefined;
        this.is_comment = opts.is_comment ? { ...opts.is_comment } : undefined;
        this.is_regex = opts.is_regex ? { ...opts.is_regex } : undefined;
        this.depth = { ...opts.depth };
        this.char = opts.char;
        this.next = opts.next;
        this.prev = opts.prev;
        this.is_whitespace = opts.is_whitespace;
        this.is_inline_whitespace = opts.is_inline_whitespace;
        this.is_eol = opts.is_eol;
        this.avail = opts.avail;
        this.no_avail = opts.no_avail;
        this.is_escaped = opts.is_escaped;
        this.is_not_escaped = opts.is_not_escaped;
        // no need to call init() also saves a bit of performance.
        return this;
    }

    /**
     * Reset the state to the start of the source data.
     * @returns The current state instance for method chaining.
     */
    reset(): this {
        this.pos = 0;
        this.line = 1;
        this.col = 1;
        this.at_sol = true;
        this.sol_index = 0;
        this.is_str = undefined;
        this.is_comment = undefined;
        this.is_regex = undefined;
        this.depth = {
            parenth: 0,
            bracket: 0,
            brace: 0,
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
     */
    stop(): this {
        this.reset();
        this.pos = this.end;
        /** @warning dont call init() here since that causes issues with previous state attributes. */
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
    switch_language(language: Language | Language.Opts | DefaultLanguageName): Language | undefined | string {
        if (this.is_str || this.is_comment || this.is_regex) {
            return "Cannot switch language while current state is inside a string, comment or regex literal.";
        }
        const old = this.lang;
        this.lang = language instanceof Language ? language : new Language(language);

        // Only initialize before any advances.
        // Ensure this happens. Otherwise when a user inits an iterator with data.
        // And then later switches langs, and there happens to be a comment like
        // At the first offset, then the new lang opts are never initialized, and its missed.
        // Note this doesnt work when start pos is not 0.
        if (this.pos === 0) this.init();

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
    private scan_opening_lang_patterns(): void {
        if (this.lang.has_patterns && this.is_not_escaped /*&& this.is_code done by container */) {
            // console.log("Is comment?", {
            //     at_sol: old_at_sol,
            //     pos: this.pos,
            //     peek: this.peek,
            //     next: this.next,
            //     next_next: this.source.data[this.pos + 2],
            //     lang_comment_line: this.lang.comment?.line,
            // });

            // detect string start
            if (this.lang.string?.has(this.char)) {
                this.is_str = { open: this.char, pos: this.pos }
                // console.log(Color.orange(`Detected string start: ${this.peek} at pos ${this.pos}`));
            }

            // detect line comment
            else if (
                this.lang.comment?.line
                && (this.at_sol || !this.lang.comment.line.sol)
                && this.char === this.lang.comment.line.open[0]
                && this.source.data.startsWith(this.lang.comment.line.open, this.pos)
            ) {
                this.is_comment = { type: 'line', open: this.lang.comment?.line.open, pos: 0 };
                // console.log(Color.orange(`Detected line comment at ${this.pos}`));
            }

            // detect block comment
            else if (
                this.lang.comment?.block
                && this.lang.comment.first_block_chars?.has(this.char)
            ) {
                for (const [open, close] of this.lang.comment.block) {
                    if (
                        (open.length === 1 && this.char === open)
                        || (open.length > 1 && this.source.data.startsWith(open, this.pos))
                    ) {
                        this.is_comment = { type: 'block', open, close, pos: 0 };
                        break;
                    }
                }
                // fallthrough
            }

            // detect regex literal
            if (
                this.lang.regex &&
                this.lang.first_regex_chars?.has(this.char)
            ) {
                for (const [open, close] of this.lang.regex) {
                    if ((open.length === 1 && this.char === open) || (open.length > 1 && this.source.data.startsWith(open, this.pos))) {
                        this.is_regex = { open, close, pos: 0 };
                        break;
                    }
                }
                // fallthrough
            }
        }
    }

    /**
     * Scan closing language patterns.
     * @warning Should only be called when `this.lang.has_patterns`
     */
    private scan_closing_lang_patterns(): void {
        if (this.is_not_escaped && !this.is_code) {

            // Inside string
            // @todo support strings inside template strings for js/ts.
            if (
                this.is_str
                && this.is_str.pos !== this.pos
                && this.char === this.is_str.open
            ) {
                // console.log(Color.orange(`Found string end: ${this.peek} at pos ${this.pos} - delim ${this.is_str.open} - open pos ${this.is_str.pos} - data: [${this.source.data.slice(this.is_str.pos, this.pos + 1)}]`));
                this.is_str = undefined;
            }

            // Inside comment
            else if (this.is_comment && this.is_comment.type === 'block') {
                const com = this.is_comment;
                const close = com.close!;
                const pos_in_close = com.pos;
                if (this.char === close[pos_in_close]) {
                    com.pos++;
                    if (com.pos === close.length) {
                        this.is_comment = undefined;
                    }
                } else {
                    com.pos = this.char === close[0] ? 1 : 0;
                }
            }

            // Inside regex
            else if (this.is_regex) {
                const rex = this.is_regex;
                const close = rex.close;
                if (this.char === close[rex.pos]) {
                    rex.pos++;
                    if (rex.pos === close.length) {
                        this.is_regex = undefined;
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
    private set_defaults(): void {

        // Update the peek, next and prev characters.
        this.char = this.source.data[this.pos] ?? "";
        this.next = this.source.data[this.pos + 1] ?? "";
        this.prev = this.source.data[this.pos - 1] ?? "";

        // Set available flags.
        this.avail = this.pos < this.end;
        this.no_avail = this.pos >= this.end;

        /**
         * Set the `is_escaped` attribute.
         * Ensure we use `pos` here not `-1`, since `is_escaped_at`
         * already looks at the previous character.
         */
        this.is_escaped = this.prev !== "\\" ? false : this.is_escaped_at(this.pos); // 
        this.is_not_escaped = !this.is_escaped;

        // Assign whitespace and line terminator attributes.
        this.is_whitespace = false;
        this.is_inline_whitespace = false;
        this.is_eol = false;

        // Is whitespace.
        if (this.lang.inline_whitespace.has(this.char)) {
            this.is_inline_whitespace = true;
            this.is_whitespace = true;
        }

        // Is line terminator.
        if (this.is_not_escaped && this.lang.line_terminators.has(this.char)) {
            this.is_eol = true;
            this.is_whitespace = true;
            if (this.is_comment?.type === "line") {
                this.is_comment = undefined;
            }
        }

        // Depths.
        if (this.is_code) {
            switch (this.char) {
                case '(': this.depth.parenth++; break;
                case ')': if (this.depth.parenth > 0) { this.depth.parenth--; } break;
                case '[': this.depth.bracket++; break;
                case ']': if (this.depth.bracket > 0) { this.depth.bracket--; } break;
                case '{': this.depth.brace++; break;
                case '}': if (this.depth.brace > 0) { this.depth.brace--; } break;
                // case '<': this.depth.template++; break;
                // case '>': if (this.depth.template > 0) { this.depth.template--; } break;
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
    init(): void {

        // Copy / extract the old state with the attrs required for the advance method.
        let at_sol: boolean = this.pos === 0, sol_index = 0;
        if (!at_sol) {
            const src = this.source.data;
            const ws = this.lang.inline_whitespace;
            const eols = this.lang.line_terminators;
            for (let i = this.pos - 1; i >= 0; i--) {
                const c = src[i];
                if (eols.has(c)) {

                    // CRLF (standard Windows).
                    if (c === "\r" && src[i + 1] === "\n") {
                        sol_index = i + 2;     // skip both chars
                    }

                    // LFCR (mixed-EOL “weird” files).
                    else if (c === "\n" && i > 0 && src[i - 1] === "\r") {
                        i--;                   // step back onto the CR
                        sol_index = i + 2;     // skip both chars
                    }

                    // Lone terminator.
                    else {
                        sol_index = i + 1;     // skip this single char
                    }

                    at_sol = true;
                    break;
                }
                // At whitespace, keep scanning.
                if (ws.has(c)) continue;
                // Hit real code/token, we are not at sol.
                break;
            }
            // for (let i = this.pos; i > 0; i--) {
            //     const c = this.source.data[i];
            //     if (this.lang.line_terminators.has(c)) {
            //         at_sol = true;
            //         sol_index = i + 1;
            //         if (c === "\r" && this.source.data[i + 1] === "\n") {
            //             ++sol_index; // skip \n from \r\n
            //         }
            //         break;
            //     }
            //     else if (this.lang.inline_whitespace.has(c)) continue;
            //     break; // stop.
            // }
        }

        // Detect end of language patterns before advancing.
        // Ensure we check agains `was_code` to preven opening the string again.
        if (this.lang.has_patterns && this.is_not_escaped && !this.is_code) {
            this.scan_closing_lang_patterns();
        }

        // Set at start of file.
        this.at_sol = at_sol;
        this.sol_index = sol_index;

        // Set defaults for pos.
        this.set_defaults();

        // Detect opening language patterns.
        // Ensure `at_sol` is assigned before calling this.
        if (this.lang.has_patterns && this.is_not_escaped && this.is_code) {
            this.scan_opening_lang_patterns();
        }

        // Jump to the end of the comment when `exclude_comments` is enabled.
        if (this.exclude_comments && this.is_comment && this.avail) {
            this.consume_comment();
            return;
            // this.advance();
        }

        // return;
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
    advance(): void {

        // Create a minimum copy of the old state that is required as info for advancing.
        const old_state = {
            // at_sol: this.at_sol,
            // sol_index: this.sol_index,
            is_inline_whitespace: this.is_inline_whitespace,
            is_eol: this.is_eol,
        }

        // Detect end of language patterns before advancing.
        // Ensure we check agains `was_code` to preven opening the string again.
        if (this.lang.has_patterns && this.is_not_escaped && !this.is_code) {
            this.scan_closing_lang_patterns();
        }

        // Advance the state position.
        if (old_state.is_eol) {
            // At end of line before incrementing the pos.
            if (this.char === "\r" && this.next === "\n") {
                // this is very importand, since we need to count the \r\n as a single line terminator.
                // and we dont want the user to visit the \n char, since would clash with is_eol and other things.
                // also this is how major engines handle this.
                this.pos += 2; // skip \r\n
            } else {
                this.pos++;
            }
            this.line++;
            this.col = 1;
            this.sol_index = this.pos;
            this.at_sol = true;
        }
        else {
            // Increment the pos and column.
            this.pos++;
            this.col++;

            // Set at start of file.
            // @warning Do this after the `sol_index` has been updated by the increment pos section
            if (this.at_sol && !old_state.is_inline_whitespace) {
                this.at_sol = false;
            }
        }

        // Set defaults for pos.
        this.set_defaults();

        // Detect opening language patterns.
        // Ensure `at_sol` is assigned before calling this.
        if (this.lang.has_patterns && this.is_not_escaped && this.is_code) {
            this.scan_opening_lang_patterns();
        }

        // Forward on comment when exclude is requested.
        if (this.exclude_comments && this.is_comment && this.avail) {
            // console.log(Color.yellow(`Excluding inside comment at ${this.pos}`));
            this.consume_comment();
        }

        // console.log("Visiting char ", this.debug_cursor());

        // return ; // search query
    }

    /**
     * Perform a minor system advance on a small clone of the iterator,
     * meant to only advance the iterator while tracking the current `line` and `col` context.
     * @warning Do not pass an `Iterator` instance to parameter `ctx`, since this may cause undefined behaviour.
     * @param ctx The context to advance.
     */
    private minor_advance(ctx: {
        pos: number,
        line: number,
        col: number,
        at_sol: boolean,
    }): void {
        const old_char = this.source.data[ctx.pos];
        // Advance the state position.
        if (this.lang.line_terminators.has(old_char) && this.is_not_escaped) {
            // At end of line before incrementing the pos.
            if (this.char === "\r" && this.next === "\n") {
                // this is very importand, since we need to count the \r\n as a single line terminator.
                // and we dont want the user to visit the \n char, since would clash with is_eol and other things.
                // also this is how major engines handle this.
                this.pos += 2; // skip \r\n
            } else {
                this.pos++;
            }
            ctx.line++;
            ctx.col = 1;
            ctx.at_sol = true;
        }
        else {
            // Increment the pos and column.
            ctx.pos++;
            ctx.col++;
            // Set at start of file.
            // @warning Do this after the `sol_index` has been updated by the increment pos section
            if (ctx.at_sol && !this.lang.inline_whitespace.has(old_char)) {
                ctx.at_sol = false;
            }
        }
    }

    // --------------------------------------------------------
    // Retrieving characters.

    /** Peek characters at the current position + adjust. */
    peek(adjust: number): string { return this.source.data[this.pos + adjust] ?? ""; }

    /** Get a char at at a specific position, does not check indexes. */
    at(pos: number): string {
        return this.source.data[pos];
    }

    /**
     * Get a char code at at a specific position, does not check indexes.
     * @returns the character code of the character at the specified position in the source data, or NaN if the position is out of bounds.
     */
    char_code_at(pos: number): number {
        return this.source.data.charCodeAt(pos);
    }

    // --------------------------------------------------------
    // Retrieving locations.

    /** Capture the current location. */
    loc(): Location<true, Src> {
        return {
            line: this.line,
            col: this.col,
            pos: this.pos,
            source: this.source,
        };
    }

    // --------------------------------------------------------
    // Consuming methods.

    /** Advance a number of positions. */
    advance_n(n: number): void { while (n--) this.advance() }

    /**
     * Advance to a given future position.
     * When execution is finished, the position will be set to the given position.
     */
    advance_to(n: number): void {
        if (n < this.pos) throw new Error(`Cannot advance to a past position ${n} < ${this.pos}`);
        if (n >= this.end) this.stop();
        else while (this.avail && this.pos < n) this.advance();
    }

    /**
     * Jump to a position.
     * This is mainly used to jump to a position potentially without advancing.
     * When `lang` is defined, we can only jump forward, since we need to call `advance()` to update the language contexts.
     * However, when `lang` is not defined, we can jump to any position without advancing.
     * The `this.pos` will be set to the given position, and the state will be initialized.
     * When `lang` is defined, the position must be greater than or equal to the current position.
     * @throws An error when the position is out of bounds, or when jumping to a past position with a language defined.
     */
    jump_to(n: number): void {
        if (n < 0 || n >= this.end) {
            throw new Error(`Cannot jump to position ${n}, must be between 0 and ${this.end - 1}.`);
        }
        if (this.lang.has_patterns) {
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
    consume_optional(s: string): void {
        if ((s.length === 1 && this.char === s) || (s.length > 0 && this.match_prefix(s))) {
            this.advance_n(s.length);
        }
    }

    /** Consume inline whitespace (excluding line breaks). */
    consume_inline_whitespace(): void { while (this.is_inline_whitespace) this.advance() }

    /** Consume whitespace (including line breaks). */
    consume_whitespace(): void { while (this.is_whitespace) this.advance() }

    /** Consume a single optional end of line char. */
    consume_eol(): void { if (this.is_eol) this.advance(); }

    /** Consume one or multiple optional end of line's*. */
    consume_eols(): void { while (this.is_eol) this.advance(); }

    /**
     * Consume while.
     * This function breaks without advancing when `fn` returns a false-like value, or when there is no data left.
     */
    consume_while<S extends boolean = false>(
        fn: Iterator.Visit<Src>,
        slice?: S,
    ): S extends true ? string : void {
        const start = this.pos;
        while (this.avail && fn(this)) this.advance();
        if (slice) return this.source.data.slice(start, this.pos) as any;
        return undefined as any;
    }

    /**
     * Consume util, reversed of `consume_while`.
     * Automatically checks `this.avail` and breaks when there is no data left.
     */
    consume_until<S extends boolean = false>(
        fn: Iterator.Visit<Src>,
        slice?: S,
    ): S extends true ? string : void {
        return this.consume_while((...args) => !fn(...args), slice)
    }

    /**
     * Consume the entire line till (not including) the end of line.
     * Automatically checks `this.avail` and breaks when there is no data left.
     * @note This does not consume the end of line character.
     */
    consume_line<S extends boolean = false>(
        slice?: S,
    ): S extends true ? string : void {
        return this.consume_until((s) => s.is_eol, slice);
    }

    /** Consume an optional comment at the current location. */
    consume_comment<S extends boolean = false>(
        slice?: S,
    ): S extends true ? string : void {
        type Res = S extends true ? string : void;
        if (!this.is_comment?.close) return (slice ? "" : undefined) as Res;

        // Find the end of the line.
        const start = this.pos;
        let end = this.find_next_eol_fast(this.pos);

        // No more data left, stop the iterator.
        if (end === -1) {
            this.stop(); 
            return (slice ? this.source.data.slice(start) : undefined) as Res;
        }

        // Jump to the end of the line if this is a line comment.
        if (this.is_comment.type === "line") {
            this.pos = end;
            this.init();
            return (slice ? this.source.data.slice(start, end) : undefined) as Res;
        }

        // Create a minor iterator context and walk to the end of the block comment.
        const ctx = {
            pos: this.pos,
            line: this.line,
            col: this.col,
            at_sol: this.at_sol,
        };
        let is_comment_pos = this.is_comment.pos;
        if (this.is_comment.close) {
            while (ctx.pos < this.end) {
                // Get the current character.
                const char = this.source.data[ctx.pos];
                if (char === undefined) break; // out of bounds, stop.

                // If we are at the end of the comment, stop.
                if (char === this.is_comment.close[is_comment_pos]) {
                    is_comment_pos++;
                    if (is_comment_pos === this.is_comment.close.length) {
                        this.is_comment = undefined;
                        this.pos = ctx.pos + 1; // advance to the next position after the comment.
                        this.init();
                        return (slice ? this.source.data.slice(start, ctx.pos + 1) : undefined) as Res;
                    }
                } else if (is_comment_pos > 0) is_comment_pos = 0;

                // Advance the context.
                this.minor_advance(ctx);
            }
        }
        return (slice ? this.source.data.slice(start, ctx.pos) : undefined) as Res;
    }

    /**
     * Walk the iterator to the end of a file with a visit callback.
     * The iterator will automatically advance to the next position, if the callback has not advanced the iterator.
     * If iteration will stop if the callback returns exactly `false`, not when a falsy value is returned.
     * @returns The current iterator instance for method chaining.
     */
    walk(fn: Iterator.Visit<Src>): this {
        while (this.avail) {
            const pos = this.pos;
            if (fn(this) === false) break;
            if (this.pos === pos) this.advance();
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
    while<Slice extends boolean = false>(
        fn: Iterator.Visit<Src>,
        slice?: Slice,
    ): Slice extends true ? string : Iterator<Src> {
        const state = this.clone();
        const start = state.pos;
        while (state.avail && fn(state)) state.advance();
        if (slice) return state.source.data.slice(start, state.pos) as any;
        return state as any;
    }

    /**
     * Iterate util, reversed of `while`.
     * This does not consume any data, but the `state` and `it` from the callback are shallow copies.
     * A reached state can be restored using `this.restore(new_state)`.
     * Automatically checks `state.avail` and breaks when there is no data left.
     * @returns The sliced content if `slice` is true, otherwise the cloned iterator, stopped at the matched position or eof.
     */
    until<Slice extends boolean = false>(
        fn: Iterator.Visit<Src>,
        slice?: Slice,
    ): Slice extends true ? string : Iterator<Src> {
        return this.while((...args) => !fn(...args), slice)
    }

    // --------------------------------------------------------
    // Character checks.

    /**
     * Check if a given index is escaped by a preceding `\\`,
     * accounts for multiple backslashes.
     * @param index The index of the character to check, note that this should not be the index of the `\\` itself.
     * @returns `true` if the character at the index is escaped by its preceding `\\`, `false` otherwise.
     */
    is_escaped_at(index: number): boolean {
        if (this.source.data[index - 1] !== '\\') return false;
        let i = index - 1;
        let backslash_count = 1; // include the backslash at index-1
        while (--i >= 0 && this.source.data[i] === "\\") backslash_count++;
        // for (let i = index - 2; i >= 0 && this.source.data[i] === "\\"; i--) {
        //     backslash_count++;
        // }
        return backslash_count % 2 === 1; // if the number of backslashes is odd, the character is escaped.
    }


    /**
     * Is a linebreak (line terminator), a.k.a is this char one of the provided line terminators chars.
     * @param c The character or index of the character to check.
     * @note Use `this.is_linebreak` to check the char at the current position, instead of this method.
     */
    is_linebreak(c: string | number): boolean {
        if (typeof c === "number") return this.lang.line_terminators.has(this.source.data[c]);
        return this.lang.line_terminators.has(c);
    }

    /**
     * Is whitespace, so including the line terminators and normal whitespace chars.
     * @param c The character or index of the character to check.
     * @note Use `this.is_whitespace` to check the char at the current position, instead of this method.
     */
    is_whitespace_at(c: string | number): boolean {
        if (typeof c === "number") c = this.source.data[c];
        return this.lang.whitespace.has(c);
    }

    /**
     * Is whitespace, so only the inline whitespace chars, not the line terminators.
     * @param c The character or index of the character to check.
     * @note Use `this.is_inline_whitespace` to check the char at the current position, instead of this method.
     */
    is_inline_whitespace_at(c: number | string): boolean {
        if (typeof c === "number") return this.lang.inline_whitespace.has(this.source.data[c]);
        return this.lang.inline_whitespace.has(c);
    }

    /**
     * Is alphanumeric char [a-zA-Z0-9]
     * @param c The character or index of the character to check.
     */
    is_alphanumeric(c: string | number = this.char): boolean {
        const code = typeof c === "number"
            ? this.source.data.charCodeAt(c)
            : c.charCodeAt(0);
        return (code >= 0x30 && code <= 0x39) || // 0-9
            (code | 32) >= 0x61 && (code | 32) <= 0x7A; // a-z or A-Z
    }

    /**
     * Is lowercase char [a-z]
     * @param c The character or index of the character to check.
     */
    is_lowercase(c: string | number = this.char): boolean {
        if (typeof c === "number") c = this.source.data[c];
        switch (c) {
            case "a": case "b": case "c": case "d": case "e": case "f": case "g":
            case "h": case "i": case "j": case "k": case "l": case "m": case "n":
            case "o": case "p": case "q": case "r": case "s": case "t": case "u":
            case "v": case "w": case "x": case "y": case "z":
                return true;
            default:
                return false;
        }
    }

    /**
     * Is uppercase char [A-Z]
     * @param c The character or index of the character to check.
     */
    is_uppercase(c: string | number = this.char): boolean {
        if (typeof c === "number") c = this.source.data[c];
        switch (c) {
            case "A": case "B": case "C": case "D": case "E": case "F": case "G":
            case "H": case "I": case "J": case "K": case "L": case "M": case "N":
            case "O": case "P": case "Q": case "R": case "S": case "T": case "U":
            case "V": case "W": case "X": case "Y": case "Z":
                return true;
            default:
                return false;
        }
    }

    /**
     * Is a numeric char [0-9]
     * @param c The character or index of the character to check.
     */
    is_numeric(c: string | number = this.char): boolean {
        if (typeof c === "number") c = this.source.data[c];
        switch (c) {
            case "0": case "1": case "2": case "3": case "4": case "5": case "6":
            case "7": case "8": case "9":
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
    is_word_boundary(c: string | number = this.char): boolean {
        if (typeof c === "number") c = this.source.data[c];
        if (c.length !== 1) return true;
        const code = c.charCodeAt(0);
        // '0'–'9'
        if (code >= 0x30 && code <= 0x39) return false;
        // 'A'–'Z'
        if (code >= 0x41 && code <= 0x5A) return false;
        // '_' (0x5F) or '$' (0x24)
        if (code === 0x5F || code === 0x24) return false;
        // 'a'–'z'
        if (code >= 0x61 && code <= 0x7A) return false;
        // Anything else is a boundary
        return true;
    }

    // --------------------------------------------------------
    // Substring and regex matching methods.

    /** Starts with check at current position */
    match_prefix(s: string, start = this.pos): boolean {
        return this.source.data.startsWith(s, start);
    }

    /** cache of “sticky” regexes so we only compile them once */
    private _match_reg_cache = new WeakMap<RegExp, RegExp>();

    /**
     * Try to match `re` exactly at `start` (defaults to current pos).
     * @returns the match array (with captures) or undefined.
     */
    match_regex(re: RegExp, start = this.pos): RegExpExecArray | undefined {
        // 1. Get or build a sticky version of `re`
        let sticky = this._match_reg_cache.get(re);
        if (!sticky) {
            // preserve original flags, add 'y' for sticky
            const flags = re.flags.includes('y') ? re.flags : re.flags + 'y';
            sticky = new RegExp(re.source, flags);
            this._match_reg_cache.set(re, sticky);
        }
        // 2. Anchor it at `start`…
        sticky.lastIndex = start;
        // 3. Exec—will only succeed if it matches exactly at lastIndex
        return sticky.exec(this.source.data) ?? undefined;
    }

    // --------------------------------------------------------
    // Search methods.

    /**
     * Get the index of the next end of line, or -1 if not found.
     * @param next If set to `1`, returns the next EOL index;
     *             `2` returns the second next EOL; etc.
     */
    find_next_eol(next: number = 1): number {
        if (next < 1) {
            throw new Error(`Invalid next value ${next}, must be greater than 0`);
        }
        const src = this.source;
        let search_pos = this.pos;

        while (next > 0) {

            // Find the next end of line character.
            let idx = -1;
            for (let i = search_pos; i < src.data.length; i++) {
                if (this.lang.line_terminators.has(src.data[i]) && !this.is_escaped_at(i)) {
                    idx = i;
                    break;
                }
            }
            if (idx === -1) return -1; // no more EOL found

            next -= 1;
            if (next === 0) return idx;
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
     */
    find_next_eol_fast(start: number = this.pos, end = this.source.data.length): number {
        const src = this.source;
        const charset = this.lang.line_terminators;
        for (let i = start; i < end; i++) {
            if (charset.has(src.data[i]) && !this.is_escaped_at(i)) return i;
        }
        return -1; // no more EOL found
    }

    /**
     * Find a character.
     * @param fn The function to match the character against, should return true if the character matches.
     * @param end The end index to stop searching at, defaults to the `this.end` attribute. When set to `-1`, it will immediately return `undefined`.
     * @note The state passed to the function is NOT the current state, but a copy of the state at the start index.
     * @returns The found character that matched the function, or undefined if not found.
     * @dev_note For now we dont support a start index, since we would need to jump() a state without knowing the line etc.
     */
    find(
        fn: Iterator.Visit<Src>,
        end: -1 | number = this.end,
    ): string | undefined {
        if (end === -1) { return undefined; }
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
        return undefined; // not found
    }

    /**
     * Find a character's index.
     * @param fn The function to match the character against, should return true if the character matches.
     * @param end The end index to stop searching at, defaults to the `this.end` attribute. When set to `-1`, it will immediately return `-1`.
     * @returns The index of the found character that matched the function, or undefined if not found.
     * @dev_note For now we dont support a start index, since we would need to jump() a state without knowing the line etc.
     */
    find_index(
        fn: Iterator.Visit<Src>,
        end: -1 | number = this.end,
    ) {
        if (end === -1) { return -1; }
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
        return -1; // not found
    }

    /**
     * Peek at the first character of the next line.
     * @param skip Optionally use a filter to skip over first characters, if the skip function returns true the index will be incremented, till the next end of line is reached.
     * @returns The first character of the next line, or an empty string if there is no next line.
     */
    first_niw_of_next_line(): string {
        const i = this.find_next_eol_fast(this.pos);
        if (i < 0) return "";
        const first = this.incr_on_inline_whitespace(i + 1);
        if (first >= this.end) return "";
        return this.source.data[first];
    }

    /** Get the first non whitespace char looking from index `start`, defaults to `this.pos` */
    first_non_whitespace(start: number = this.pos): string | undefined {
        const i = this.incr_on_whitespace(start);
        return i >= this.end ? undefined : this.source.data[i];
    }

    /** Get the first non whitespace char looking from index `start`, defaults to `this.pos` */
    first_non_inline_whitespace(start: number = this.pos): string | undefined {
        const i = this.incr_on_inline_whitespace(start);
        return i >= this.end ? undefined : this.source.data[i];
    }

    // --------------------------------------------------------
    // Increment and decrement methods.

    /**
     * Increment the index until a non-whitespace char is found, stops if the char at the index is not inline whitespace.
     * @param index The index to start incrementing from.
     * @param end The end index to stop incrementing at, defaults to the `this.end` attribute.
     */
    incr_on_whitespace(index: number, end?: number): number {
        if (end == null) end = this.end;
        if (index < 0 || index >= end) { return index; }
        let c: string | undefined;
        while (index < end && this.lang.whitespace.has(this.source.data[index])) ++index;
        return index;
    }
    incr_on_inline_whitespace(index: number, end?: number): number {
        if (end == null) end = this.end;
        if (index < 0 || index >= end) { return index; }
        let c: string | undefined;
        while (index < end && this.lang.inline_whitespace.has(this.source.data[index])) ++index; 
        return index;
    }

    /** Decrement the index until a non-whitespace char is found, stops if the char at the index is not inline whitespace. */
    decr_on_whitespace(index: number, min_index: number, plus_1_when_decremented: boolean = false): number {
        if (index < 0 || index >= this.end) { return index; }
        let c: string | undefined;
        const si = index;
        while (index >= min_index && this.lang.whitespace.has(this.source.data[index])) { --index; }
        if (plus_1_when_decremented && si !== index) {
            index++;
        }
        return index;
    }
    decr_on_inline_whitespace(index: number, min_index: number, plus_1_when_decremented: boolean = false): number {
        if (index < 0 || index >= this.end) { return index; }
        let c: string | undefined;
        const si = index;
        while (index >= min_index && this.lang.inline_whitespace.has(this.source.data[index])) { --index; }
        if (plus_1_when_decremented && si !== index) {
            index++;
        }
        return index;
    }

    // ----------------------------------------------------------------
    // Slicing methods.

    /** Slice the current line till the current position or till the end of the line without consuming. */
    slice_line(opts?: { full?: boolean }): string {
        const end: number = opts?.full
            ? this.find_next_eol_fast(this.pos)
            : this.pos;
        return end < this.sol_index
            ? this.source.data.slice(this.sol_index)
            : this.source.data.slice(this.sol_index, end)
    }

    /** Slice the next line. */
    slice_next_line(): string {
        const i = this.find_next_eol_fast(this.pos)
        return i < 0
            ? this.source.data.slice(this.pos)
            : this.source.data.slice(this.pos, i);
    }

    /** Slice content */
    slice(start: number, end: number): string {
        return this.source.data.slice(start, end);
    }

    // --------------------------------------------------------
    // Debug helpers.

    /** Get debug info about the (minimized) cursor position. */
    debug_cursor(): object {
        return {
            ch: this.char,
            pos: this.pos,
            loc: `${this.line}:${this.col}`,
            ...(this.at_sol ? { at_sol: this.at_sol } : {}),
            ...(this.is_eol ? { is_eol: this.is_eol } : {}),
            ...(this.is_comment ? { is_comment: this.is_comment } : {}),
            ...(this.is_str ? { is_str: this.is_str } : {}),
            ...(this.is_regex ? { is_regex: this.is_regex } : {}),
        }
    }

    /** Debug methods */
    debug_dump_code(title: string, code: string, colored = true): string {
        let lines = code.split('\n');
        let plain_lines = lines;

        plain_lines = plain_lines.map((l, i) => `| ${i + 1}: ${l}`);
        lines = lines.map((l, i) => `${Color.bold("|")} ${i + 1}: ${Color.italic(l)}`);

        plain_lines = [`| ${title}`, ...plain_lines];
        lines = [`${Color.bold("|")} ${Color.bold(title)}`, ...lines];

        let max = Math.max(...plain_lines.map(l => l.length));
        plain_lines = plain_lines.map(
            l => `${l}${" ".repeat(max - l.length)} |`
        );
        max = Math.max(...lines.map(l => l.length));
        lines = lines.map(
            l => `${l}${" ".repeat(max - l.length)} ` + Color.bold("|")
        );
        max = Math.max(...plain_lines.map(l => l.length));
        return (
            Color.bold("-".repeat(max)) + "\n" +
            (colored ? lines : plain_lines).join("\n") + "\n" +
            Color.bold("-".repeat(max))
        )
    }

    // ---------------------------------------------------------------------------
    // Static methods

    /**
     * Split source data into lines.
     */
    static split_lines(source: string | { data: string }, language?: Language): string[] {
        const it = new Iterator(
            typeof source === "string" ? { data: source } : source,
            { language },
        );
        const lines: string[] = [];
        while (it.avail) {
            const line = it.consume_until((s) => s.is_eol, true);
            if (line) lines.push(line);
            it.advance(); // consume the newline
        }
        return lines;
    }


    // @todo create this when needed.
    // /**
    //  * Slice the lines of a source file path into lines while reading it in chunks.
    //  * Forwarding the state instance between chunks.
    //  */
    // export function slice_lines_from_file(
    //     path: Path | string,
    // ) { }

}

/** Iterator types. */
export namespace Iterator {

    /** Is string type, used to track the string context. */
    export interface IsStr {
        /** the opening char. */
        open: string;
        /** current offset for matching the close pattern. */
        pos: number;
    }

    /** Is comment type, used for tracking the comment context. */
    export interface IsComment {
        /** comment type. */
        type: 'line' | 'block';
        open: string;
        close?: string;
        /** current offset for matching the close pattern. */
        pos: number;
    }

    /** Is regex type, used for tracking the regex context. */
    export interface IsRegex {
        open: string;
        close: string;
        /** current offset for matching the close pattern. */
        pos: number;
    }

    /** Depth info type */
    export interface Depth {
        /** Parentheses: round brackets `(` and `)`. */
        parenth: number;
        /** Brackets: square brackets `[` and `]`. */
        bracket: number;
        /** Braces: curly braces `{` and `}`. */
        brace: number;
        /** Angle brackets: `<` and `>`. */
        // template: number;
    }

    /**
     * A callback type for visiting the state in an iterator.
     * @returns Should return a `truthy` or `falsy` value, will be checked as `if (cb(...))` in the iterator.
     */
    export type Visit<S extends Source> = (state: Iterator<S>) => any;

    /** State input options. */
    export type State<S extends Source = Source> = ConstructorParameters<typeof Iterator<S>>[0];

    /** Options input. */
    export type Opts<S extends Source = Source> = ConstructorParameters<typeof Iterator<S>>[1];
}


/**
 * Default `Iterator.opts` for common languages.
 */
export const Languages: Record<string, Language> = {
    js: new Language({
        name: "js",
        // All valid whitespace, should be valid for all js variants.
        inline_whitespace: [
            // ASCII
            " ", "\t", "\u000B", "\u000C",
            // Unicode WhiteSpace
            "\u00A0", "\u1680", "\u180E", "\u2000", "\u2001", "\u2002", "\u2003",
            "\u2004", "\u2005", "\u2006", "\u2007", "\u2008", "\u2009", "\u200A",
            "\u202F", "\u205F", "\u3000", "\uFEFF",
        ],
        // All valid line terminators, should be valid for all js variants.
        line_terminators: [
            "\n",        // U+000A – LF
            "\r",        // U+000D – CR  (handle CRLF as one break)
            "\u2028",    // U+2028 – LS
            "\u2029",    // U+2029 – PS
            "\u0085",    // U+0085 – NEL (TypeScript extension – safe to include)
        ],
        string: ["'", '"', '`'],
        comment: {
            line: {
                open: "//",
                sol: false,
            },
            block: [["/*", "*/"]],
        },
        // regex: [["/", "/"]],
    }),
    ts: new Language({
        name: "ts",
        // All valid whitespace, should be valid for all ts variants.
        inline_whitespace: [
            // ASCII
            " ", "\t", "\u000B", "\u000C",
            // Unicode WhiteSpace
            "\u00A0", "\u1680", "\u180E", "\u2000", "\u2001", "\u2002", "\u2003",
            "\u2004", "\u2005", "\u2006", "\u2007", "\u2008", "\u2009", "\u200A",
            "\u202F", "\u205F", "\u3000", "\uFEFF",
        ],
        // All valid line terminators, should be valid for all ts variants.
        line_terminators: [
            "\n",        // U+000A – LF
            "\r",        // U+000D – CR  (handle CRLF as one break)
            "\u2028",    // U+2028 – LS
            "\u2029",    // U+2029 – PS
            "\u0085",    // U+0085 – NEL (TypeScript extension – safe to include)
        ],
        string: ["'", '"', '`'],
        comment: {
            line: {
                open: "//",
                sol: false,
            },
            block: [["/*", "*/"]],
        },
        // regex: [["/", "/"]],
    }),
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
} as const;
export const languages = Languages;

/** Default language name. */
export type DefaultLanguageName = keyof typeof Languages;


// ------------------------------------------------------------------------------------
// Iterator view, for optimized `Iterator.clone` and `Iterator.while` 
// Dont like it though

// /** Cursor fields that are allowed to diverge between view and parent. */
// type CursorKeys =
//     | "pos" | "line" | "col"
//     | "at_sol" | "sol_index"
//     | "depth" | "is_str" | "is_comment" | "is_regex";

// /**
//  * A minimal interface that contains only the mutating cursor properties.
//  * We will copy-construct exactly these.
//  */
// type CursorState = Pick<Iterator<any>, CursorKeys>;

// /**
//  * Lightweight cursor-only clone of {@link Iterator}.
//  *
//  *  * **Zero unsafe casts.**  All fields are copied / forwarded explicitly.
//  *  * **No hidden super‐constructor call.**  We store the parent reference
//  *    and borrow its prototype with `Object.setPrototypeOf`.
//  *
//  * @typeParam Src  The same generic parameter that the parent iterator uses.
//  */
// export class IteratorView<Src extends Source = Source>
//     implements CursorState {
//     /* ────────────────── parent reference ─────────────────── */
//     private readonly parent: Iterator<Src>;

//     /* ────────────────── mutable cursor fields ─────────────── */
//     pos: number;
//     line: number;
//     col: number;
//     at_sol: boolean;
//     sol_index: number;

//     depth: Iterator.Depth;
//     is_str: undefined | Iterator.IsStr;
//     is_comment: undefined | Iterator.IsComment;
//     is_regex: undefined | Iterator.IsRegex;

//     /* ────────────────── construction ──────────────────────── */
//     constructor(parent: Iterator<Src>) {
//         // 1. Create an object whose prototype **is** the parent iterator.
//         //    That means every method call transparently falls back to the parent.
//         Object.setPrototypeOf(this, parent);

//         this.parent = parent;

//         // 2. Copy the mutable cursor fields (typed, no “any”).
//         ({
//             pos: this.pos,
//             line: this.line,
//             col: this.col,
//             at_sol: this.at_sol,
//             sol_index: this.sol_index,
//             depth: this.depth,
//             is_str: this.is_str,
//             is_comment: this.is_comment,
//             is_regex: this.is_regex,
//         } = { ...parent });

//         // 3. Recompute cheap flags that depend on `pos`.
//         this.init();
//     }

//     /* ────────────────── helpers ───────────────────────────── */

//     /** Create another lightweight view from this view. */
//     clone(): IteratorView<Src> {
//         return new IteratorView(this);  // still O(1)
//     }

//     /** Commit (restore) this cursor state into the parent iterator. */
//     commit(): void {
//         this.parent.restore(this as unknown as Iterator<Src>);
//     }
// }
