/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
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
export type Location<S extends Source = Source> = {
    /** Line number (1 based). */
    readonly line: number;
    /** Column number (1 based). */
    readonly col: number;
    /** Absolute position in the absolute source data. */
    readonly pos: number;
    /** The source file. */
    readonly source: S;
};
/**
 * The iterator language options.
 */
export declare class Language {
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
        readonly first_block_chars?: Set<string>;
    };
    readonly regex: undefined | [string, string] | [string, string][];
    readonly first_regex_chars: undefined | Set<string>;
    /**
     * Has any `string`, `comment` or `regex` options defined.
     */
    readonly has_patterns: boolean;
    /** Constructor. */
    constructor(opts: DefaultLanguageName | {
        /** An optional name that can be used as identifier. */
        name?: string;
        /** The inline white-space characters, defaults to `[" ", "\t"]`, excluding line terminator characters. */
        inline_whitespace?: string[];
        /**
         * The line-terminator characters, defaults to `["\n", "\r"]`
         * Note that when `\r` is present, a subsequent `\r\n` will always be treated as a single line-terminator.
         */
        line_terminators?: string[];
        /** String literal options. */
        string?: string[];
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
        };
        /** Regex literals. */
        regex?: [string, string] | [string, string][];
    });
    /**
     * Create a set from the first characters of pattern entries.
     * Can be used to perform a quick lookup if the first character matches any of the patterns.
     */
    private static _first_char_set_from_patterns;
}
export declare namespace Language {
    type Opts = ConstructorParameters<typeof Language>[0];
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
export declare class Iterator<Src extends Source = Source> {
    /**
     * The language attributes from the attached iterator.
     * @warning Do not manually change attribute `lang`, use `switch_language()` instead.
     *          Changing the language context while inside a language pattern (string, comment, regex) may cause undefined behaviour.
     */
    lang: Language;
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
        end?: number;
        /** The language options. */
        language?: Language | Language.Opts | DefaultLanguageName;
        /**
         * Exclude all comments from visitations.
         * When enabled, internally the iterator automatically advances comments. Therefore, the user will never visit a comment.
         * @note That this only guarantees that comments are excluded for the passed state, not when searching forward manually or through a non state callback iterator, or when slicing data.
         */
        exclude_comments?: boolean;
    });
    /** Is code, not string, comment or regex. */
    get is_code(): boolean;
    /** Create a (semi-deep) copy clone of all attributes except for the `source` attribute. */
    clone(): Iterator<Src>;
    /**
     * Restore an earlier state.
     * Used to guarantee the `Iterator.state` reference always points to the same state instance.
     * Otherwise it could cause undefined behaviour when the user pulls out the state for processing and later somewhere else assigns to it directly.
     * Performs a shallow copy of the `source` and `lang` attributes.
     * @param opts The state to restore.
     * @returns The current state instance for method chaining.
     */
    restore(it: Iterator<Src>): this;
    /**
     * Reset the state to the start of the source data.
     * @returns The current state instance for method chaining.
     */
    reset(): this;
    /**
     * Assign the state as stopped.
     * Basically assigning the position to the end of the source data.
     * The iterator can choose wether to advance or not.
     * @returns The current state instance for method chaining.
     */
    stop(): this;
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
     */
    switch_language(language: Language | Language.Opts | DefaultLanguageName, forced?: boolean): Language | undefined | string;
    /**
     * Scan opening language patterns.
     * Ensure this is only called when `this.lang && this.is_not_escaped && this.is_code`.
     * The following state attributes must be set for the current position:
     * - `pos`
     * - `char`
     * - `at_sol` - whether the current position is at the start of a line.
     */
    private scan_opening_lang_patterns;
    /**
     * Scan closing language patterns.
     * @warning Should only be called when `this.lang.has_patterns`
     */
    private scan_closing_lang_patterns;
    /**
     * Update all auto computed state attributes that are non context dependent.
     * a.k.a they can always be computed for the give position without knowing any of the previous or next context.
     * When combining this with language patterns, ensure its called after the `scan_closing_` and before `scan_opening_` methods.
     */
    private set_defaults;
    /**
     * Initialize the auto computed state attributes.
     *
     * @dev_note
     *      We use separate `advance()` and `init()` methods.
     *      Mainly to ensure we dont assign a value to the the value of the next pos, as is required in advance.
     *      While init() needs to assign for the exact current pos.
     */
    init(): void;
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
    advance(): void;
    /**
     * Perform a minor system advance on a small clone of the iterator,
     * meant to only advance the iterator while tracking the current `line` and `col` context.
     * @warning Do not pass an `Iterator` instance to parameter `ctx`, since this may cause undefined behaviour.
     * @param ctx The context to advance.
     */
    private minor_advance;
    /** Peek characters at the current position + adjust. */
    peek(adjust: number): string;
    /** Get a char at at a specific position, does not check indexes. */
    at(pos: number): string;
    /**
     * Get a char code at at a specific position, does not check indexes.
     * @returns the character code of the character at the specified position in the source data, or NaN if the position is out of bounds.
     */
    char_code_at(pos: number): number;
    /** Capture the current location. */
    loc(): Location<Src>;
    /** Advance a number of positions. */
    advance_n(n: number): void;
    /**
     * Advance to a given future position.
     * When execution is finished, the position will be set to the given position.
     */
    advance_to(n: number): void;
    /**
     * Jump to a position.
     * This is mainly used to jump to a position potentially without advancing.
     * When `lang` is defined, we can only jump forward, since we need to call `advance()` to update the language contexts.
     * However, when `lang` is not defined, we can jump to any position without advancing.
     * The `this.pos` will be set to the given position, and the state will be initialized.
     * When `lang` is defined, the position must be greater than or equal to the current position.
     * @throws An error when the position is out of bounds, or when jumping to a past position with a language defined.
     */
    jump_to(n: number, opts?: {
        /**
         * Wheter to advance, only advances when a language context is defined.
         * @default true
         */
        advance?: boolean;
        /**
         * When not advancing, a line number can be set.
         * This should reflect the line number at the given offset position.
         */
        line?: number;
        /**
         * When not advancing, a column number can be set.
         * This should reflect the column number at the given offset position.
         */
        col?: number;
    }): void;
    /** Consume a string match. */
    consume_optional(s: string): void;
    /** Consume inline whitespace (excluding line breaks). */
    consume_inline_whitespace(): void;
    /** Consume whitespace (including line breaks). */
    consume_whitespace(): void;
    /** Consume a single optional end of line char. */
    consume_eol(): void;
    /** Consume one or multiple optional end of line's*. */
    consume_eols(): void;
    /**
     * Consume while.
     * This function breaks without advancing when `fn` returns a false-like value, or when there is no data left.
     */
    consume_while<S extends boolean = false>(fn: Iterator.Visit<Src>, slice?: S): S extends true ? string : void;
    /**
     * Consume util, reversed of `consume_while`.
     * Automatically checks `this.avail` and breaks when there is no data left.
     */
    consume_until<S extends boolean = false>(fn: Iterator.Visit<Src>, slice?: S): S extends true ? string : void;
    /**
     * Consume the entire line till (not including) the end of line.
     * Automatically checks `this.avail` and breaks when there is no data left.
     * @note This does not consume the end of line character.
     */
    consume_line<S extends boolean = false>(slice?: S): S extends true ? string : void;
    /**
    * Consume a comment at the current location.
    *
    * - Line comments consume until the next line terminator or EOF.
    * - Block comments consume until the matching closing pattern or EOF.
    *
    * @param slice If true, returns the consumed comment content.
    * @returns The consumed comment string when slice is true.
    */
    consume_comment<S extends boolean = false>(slice?: S): S extends true ? string : void;
    /**
     * Walk the iterator to the end of a file with a visit callback.
     * The iterator will automatically advance to the next position, if the callback has not advanced the iterator.
     * If iteration will stop if the callback returns exactly `false`, not when a falsy value is returned.
     * @returns The current iterator instance for method chaining.
     */
    walk(fn: Iterator.Visit<Src>): this;
    /**
     * Iterate while.
     * This does not consume any data, but the `state` and `it` from the callback are shallow copies.
     * A reached state can be restored using `this.restore(new_state)`.
     * Automatically checks `state.avail` and breaks when there is no data left.
     * @returns The sliced content if `slice` is true, otherwise the cloned iterator, stopped at the matched position or eof.
     */
    while<Slice extends boolean = false>(fn: Iterator.Visit<Src>, slice?: Slice): Slice extends true ? string : Iterator<Src>;
    /**
     * Iterate util, reversed of `while`.
     * This does not consume any data, but the `state` and `it` from the callback are shallow copies.
     * A reached state can be restored using `this.restore(new_state)`.
     * Automatically checks `state.avail` and breaks when there is no data left.
     * @returns The sliced content if `slice` is true, otherwise the cloned iterator, stopped at the matched position or eof.
     */
    until<Slice extends boolean = false>(fn: Iterator.Visit<Src>, slice?: Slice): Slice extends true ? string : Iterator<Src>;
    /**
     * Check if a given index is escaped by a preceding `\\`,
     * accounts for multiple backslashes.
     * @param index The index of the character to check, note that this should not be the index of the `\\` itself.
     * @returns `true` if the character at the index is escaped by its preceding `\\`, `false` otherwise.
     */
    is_escaped_at(index: number): boolean;
    /**
     * Is a linebreak (line terminator), a.k.a is this char one of the provided line terminators chars.
     * @param c The character or index of the character to check.
     * @note Use `this.is_linebreak` to check the char at the current position, instead of this method.
     */
    is_linebreak(c: string | number): boolean;
    /**
     * Is whitespace, so including the line terminators and normal whitespace chars.
     * @param c The character or index of the character to check.
     * @note Use `this.is_whitespace` to check the char at the current position, instead of this method.
     */
    is_whitespace_at(c: string | number): boolean;
    /**
     * Is whitespace, so only the inline whitespace chars, not the line terminators.
     * @param c The character or index of the character to check.
     * @note Use `this.is_inline_whitespace` to check the char at the current position, instead of this method.
     */
    is_inline_whitespace_at(c: number | string): boolean;
    /**
     * Is alphanumeric char [a-zA-Z0-9]
     * @param c The character or index of the character to check.
     */
    is_alphanumeric(c?: string | number): boolean;
    /**
     * Is lowercase char [a-z]
     * @param c The character or index of the character to check.
     */
    is_lowercase(c?: string | number): boolean;
    /**
     * Is uppercase char [A-Z]
     * @param c The character or index of the character to check.
     */
    is_uppercase(c?: string | number): boolean;
    /**
     * Is a numeric char [0-9]
     * @param c The character or index of the character to check.
     */
    is_numeric(c?: string | number): boolean;
    /**
     * Check whether a character is a JavaScript “word boundary”:
     * i.e. anything _other_ than [A-Za-z0-9_$].
     * Avoids regex for maximum performance.
     * @param c A single-character string or the index of the character.
     */
    is_word_boundary(c?: string | number): boolean;
    /** Starts with check at current position */
    match_prefix(s: string, start?: number): boolean;
    /** cache of “sticky” regexes so we only compile them once */
    private _match_reg_cache;
    /**
     * Try to match `re` exactly at `start` (defaults to current pos).
     * @returns the match array (with captures) or undefined.
     */
    match_regex(re: RegExp, start?: number): RegExpExecArray | undefined;
    /**
     * Get the index of the next end of line, or -1 if not found.
     * @param next If set to `1`, returns the next EOL index;
     *             `2` returns the second next EOL; etc.
     */
    find_next_eol(next?: number): number;
    /**
     * Find the index of the next end of line, without a `next` option,
     * offering a slight performance boost. Excluding escaped line terminators.
     * @param start The index to start searching from, defaults to `this.pos`.
     * @param end The end index to stop searching at, defaults to the `this.source.data.length`.
     * @returns The index of the next end of line, or -1 if not found.
     */
    find_next_eol_fast(start?: number, end?: number): number;
    /**
     * Find a character.
     * @param fn The function to match the character against, should return true if the character matches.
     * @param end The end index to stop searching at, defaults to the `this.end` attribute. When set to `-1`, it will immediately return `undefined`.
     * @note The state passed to the function is NOT the current state, but a copy of the state at the start index.
     * @returns The found character that matched the function, or undefined if not found.
     * @dev_note For now we dont support a start index, since we would need to jump() a state without knowing the line etc.
     */
    find(fn: Iterator.Visit<Src>, end?: -1 | number): string | undefined;
    /**
     * Find a character's index.
     * @param fn The function to match the character against, should return true if the character matches.
     * @param end The end index to stop searching at, defaults to the `this.end` attribute. When set to `-1`, it will immediately return `-1`.
     * @returns The index of the found character that matched the function, or undefined if not found.
     * @dev_note For now we dont support a start index, since we would need to jump() a state without knowing the line etc.
     */
    find_index(fn: Iterator.Visit<Src>, end?: -1 | number): number;
    /**
     * Peek at the first character of the next line.
     * @param skip Optionally use a filter to skip over first characters, if the skip function returns true the index will be incremented, till the next end of line is reached.
     * @returns The first character of the next line, or an empty string if there is no next line.
     */
    first_niw_of_next_line(): string;
    /** Get the first non whitespace char looking from index `start`, defaults to `this.pos` */
    first_non_whitespace(start?: number): string | undefined;
    /** Get the first non whitespace char looking from index `start`, defaults to `this.pos` */
    first_non_inline_whitespace(start?: number): string | undefined;
    /**
     * Increment the index until a non-whitespace char is found, stops if the char at the index is not inline whitespace.
     * @param index The index to start incrementing from.
     * @param end The end index to stop incrementing at, defaults to the `this.end` attribute.
     */
    incr_on_whitespace(index: number, end?: number): number;
    incr_on_inline_whitespace(index: number, end?: number): number;
    /** Decrement the index until a non-whitespace char is found, stops if the char at the index is not inline whitespace. */
    decr_on_whitespace(index: number, min_index: number, plus_1_when_decremented?: boolean): number;
    decr_on_inline_whitespace(index: number, min_index: number, plus_1_when_decremented?: boolean): number;
    /** Slice the current line till the current position or till the end of the line without consuming. */
    slice_line(opts?: {
        full?: boolean;
    }): string;
    /** Slice the next line. */
    slice_next_line(): string;
    /** Slice content */
    slice(start: number, end: number): string;
    /** Get debug info about the (minimized) cursor position. */
    debug_cursor(): object;
    /** Debug methods */
    debug_dump_code(title: string, code: string, colored?: boolean): string;
    /**
     * Split source data into lines.
     */
    static split_lines(source: string | {
        data: string;
    }, language?: Language): string[];
}
/** Iterator types. */
export declare namespace Iterator {
    /** Is string type, used to track the string context. */
    interface IsStr {
        /** the opening char. */
        open: string;
        /** current offset for matching the close pattern. */
        pos: number;
    }
    /** Is comment type, used for tracking the comment context. */
    interface IsComment {
        /** comment type. */
        type: 'line' | 'block';
        open: string;
        close?: string;
        /** current offset for matching the close pattern. */
        pos: number;
    }
    /** Is regex type, used for tracking the regex context. */
    interface IsRegex {
        open: string;
        close: string;
        /** current offset for matching the close pattern. */
        pos: number;
    }
    /** Depth info type */
    interface Depth {
        /** Parentheses: round brackets `(` and `)`. */
        parenth: number;
        /** Brackets: square brackets `[` and `]`. */
        bracket: number;
        /** Braces: curly braces `{` and `}`. */
        brace: number;
    }
    /**
     * A callback type for visiting the state in an iterator.
     * @returns Should return a `truthy` or `falsy` value, will be checked as `if (cb(...))` in the iterator.
     */
    type Visit<S extends Source> = (state: Iterator<S>) => any;
    /** State input options. */
    type State<S extends Source = Source> = ConstructorParameters<typeof Iterator<S>>[0];
    /** Options input. */
    type Opts<S extends Source = Source> = ConstructorParameters<typeof Iterator<S>>[1];
}
/**
 * Default `Iterator.opts` for common languages.
 */
export declare const Languages: Record<string, Language>;
export declare const languages: Record<string, Language>;
/** Default language name. */
export type DefaultLanguageName = keyof typeof Languages;
