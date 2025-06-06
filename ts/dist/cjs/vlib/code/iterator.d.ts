/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Enforce, Merge } from "../types/transform.js";
/** Type alias for a state callback. */
type ConsumeFn = (state: Iterator.State, it: Iterator) => boolean;
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
export declare class Iterator {
    /** The current state. */
    state: Iterator.State;
    /** The iterator options, keep it optionally undefined so we can perform a fast check if there are no options defined. */
    config?: Iterator.Config;
    /** Constructor. */
    constructor(
    /** The compiler state. */
    state: Iterator.StateOpts, 
    /** Options */
    opts?: Iterator.Config, 
    /**
     * Optionally pass a callback and walk the iterator when invoking the constructor.
     * Advancing the iterator inside the callback is allowed.
     */
    callback?: (state: Iterator.State, it: Iterator) => void);
    /** Advance a single character, tracking contexts. */
    advance(): void;
    /** Advance a number of positions. */
    advance_n(n: number): void;
    /**
     * Stop - set the offset to the end of the source data without advancing.
     */
    stop(): void;
    /** Peek characters/ */
    peek(adjust: number): string;
    /** Has more content */
    avail(): boolean;
    more(): boolean;
    has(): boolean;
    /** Consume a string match. */
    consume_optional(s: string): void;
    /** Consume inline whitespace (excluding line breaks). */
    consume_inline_whitespace(): void;
    /** Consume whitespace (including line breaks). */
    consume_whitespace(): void;
    /** Consume while. */
    consume_while(fn: ConsumeFn, slice: true): string;
    consume_while(fn: ConsumeFn, slice?: boolean): void;
    /** Consume whle with special code opts. */
    consume_code_while(fn: ConsumeFn, slice: true): string;
    consume_code_while(fn: ConsumeFn, slice?: boolean): void;
    /** Consume util. */
    consume_until(fn: ConsumeFn, slice: true): string;
    consume_until(fn: ConsumeFn, slice?: boolean): void;
    consume_code_until(fn: ConsumeFn, slice: true): string;
    consume_code_until(fn: ConsumeFn, slice?: boolean): void;
    /** Consume until end of line. */
    consume_until_eol(): void;
    consume_until_eol_slice(): string;
    /** Consume optional end of line. */
    skip_eol(): void;
    /** Slice the current line till the current offset or till the end of the line without consuming. */
    line(opts?: {
        full?: boolean;
    }): string;
    /** Slice the next line. */
    next_line(): string;
    /** Capture the current location. */
    capture_location(): {
        line: number;
        column: number;
        offset: number;
    };
    /** Decrement the index until a non-whitespace char is found. */
    decrement_on_trim(min_index: number, index: number, plus_1_when_decrementen?: boolean): number;
    /** Slice content */
    slice(start: number, end: number): string;
}
/** Code iterator types & static methods. */
export declare namespace Iterator {
    /**
     * We use a source file for the iterator state so we can perform shallow copies of states.
     * Without copying the entire data string.
     */
    interface Source {
        /** The data string. */
        data: string;
    }
    /**
     * Input options for creating a new state.
     */
    type StateOpts = string | Merge<Source, {
        offset?: number;
    }> | Enforce<State, "source">;
    /**
     * Relative compiler state.
     * Note that the state is mutable and is changed during the iteration.
     */
    class State {
        /** The relative source file. */
        readonly source: Source;
        /** The absolute source file, in case the iterator is part of a parent iterator. Can be used to still resolve line & cols from nested iterations. */
        readonly abs_source: Source;
        /** Length of the source data */
        readonly len: number;
        /** Current relative offset position in the source data */
        offset: number;
        /** The nested offset in case `abs_source` is not `source`, can be used to still resolve line & cols from nested iterations. */
        readonly nested_offset: number;
        /** Current line number. */
        line: number;
        /** Current column number. */
        col: number;
        /** Is at the start of line (excluding whitespace). */
        at_sol: boolean;
        /** Start of line index. */
        sol_index: number;
        /** Is a string, only enabled if `CodeIterator.opts.string` is defined. */
        is_str: undefined | string;
        /** Is a comment, only enabled if `CodeIterator.opts.comment` is defined. */
        is_comment: undefined | {
            type: 'line' | 'block';
            open: string;
            close?: string;
            pos: number;
        };
        /** Is a regex, only enabled if `CodeIterator.opts.regex` is defined. */
        is_regex: undefined | {
            open: string;
            close: string;
            pos: number;
        };
        /** Depth trackings. */
        depth: {
            /** Parentheses: round brackets `(` and `)`. */
            parenth: number;
            /** Brackets: square brackets `[` and `]`. */
            bracket: number;
            /** Braces: curly braces `{` and `}`. */
            brace: number;
            /** Angle brackets: `<` and `>`. */
            template: number;
        };
        /** Current char. */
        peek: string;
        /** Next char. */
        next?: string;
        /** Previous char. */
        prev?: string;
        /** Is whitespace `\s` (including line breaks `\n\r`). */
        is_whitespace: boolean;
        /** Is inline whitespace `\s` (excluding line breaks `\n\r`). */
        is_inline_whitespace: boolean;
        /** Is at end of line `\n`. */
        is_eol: boolean;
        /** Is a line break char `\n\r`. */
        is_line_break: boolean;
        /** Is at end of file. */
        is_eof: boolean;
        /** checks if the current char is excluded by previous \.  */
        is_excluded: boolean;
        /**
         * @warning Dont add attribute `data` or update the CodeIterator constructor since that requires the state not to have a `data` attribute.
         */
        constructor(
        /** The relative source file. */
        source: Source, 
        /** The absolute source file, in case the iterator is part of a parent iterator. Can be used to still resolve line & cols from nested iterations. */
        abs_source: Source, 
        /** Length of the source data */
        len: number, 
        /** Current relative offset position in the source data */
        offset: number, 
        /** The nested offset in case `abs_source` is not `source`, can be used to still resolve line & cols from nested iterations. */
        nested_offset: number, 
        /** Current line number. */
        line: number, 
        /** Current column number. */
        col: number, 
        /** Is at the start of line (excluding whitespace). */
        at_sol: boolean, 
        /** Start of line index. */
        sol_index: number, 
        /** Is a string, only enabled if `CodeIterator.opts.string` is defined. */
        is_str: undefined | string, 
        /** Is a comment, only enabled if `CodeIterator.opts.comment` is defined. */
        is_comment: undefined | {
            type: 'line' | 'block';
            open: string;
            close?: string;
            pos: number;
        }, 
        /** Is a regex, only enabled if `CodeIterator.opts.regex` is defined. */
        is_regex: undefined | {
            open: string;
            close: string;
            pos: number;
        }, 
        /** Depth trackings. */
        depth: {
            /** Parentheses: round brackets `(` and `)`. */
            parenth: number;
            /** Brackets: square brackets `[` and `]`. */
            bracket: number;
            /** Braces: curly braces `{` and `}`. */
            brace: number;
            /** Angle brackets: `<` and `>`. */
            template: number;
        });
        /** Construct from source. */
        static create(input: StateOpts): State;
        /** Is code, not string, comment or regex. */
        get is_code(): boolean;
        /** Get absolute offset. */
        get abs_offset(): number;
        /**
         * Perform the actual advance and update the state attributes.
         * @note This is used so we can apply a falltrough strategy in the `advance()` method.
         */
        private update;
        /**
         * Advance a single character, tracking contexts.
         * @note This method should only apply `opts` related attributes.
         * @note Allows for fallthrough behaviour due to a `update` wrapper.
         */
        advance(opts?: Iterator.Config): void;
        /** Create a (semi-deep) copy of all attributes except for the `source` and `abs_source` attributes. */
        copy(): Iterator.State;
        /**
         * Assign the state as stopped.
         * Basically assigning the offset to the end of the source data.
         * The iterator can choose wether to advance or not.
         */
        stop(): void;
        /**
         * Reset the state to the start of the source data.
         */
        reset(): void;
        /** Cached attribute for `is_variable_char` */
        _is_variable_char?: boolean;
        /** Is a char allowed in a variable name so [a-zA-Z0-9_] */
        is_variable_char(c: string): boolean;
        /** Starts with check at current position */
        match_prefix(s: string): boolean;
    }
    /** Function type for `Compiler.consume_while()` and `Compiler.consume_code_while()` */
    type ConsumeWhileFn = (c: string, i: number) => boolean;
    interface ConsumeCodeOptions {
        index: number;
        peek: string;
        prev: undefined | string;
        is_str: '`' | '\'' | '"' | undefined;
        is_excluded: boolean;
    }
    type ConsumeCodeWhileFn = (opts: ConsumeCodeOptions) => boolean;
    /**
     * The iterator config options.
     */
    interface Config {
        /** String literal options. */
        string?: string[];
        /** Comment options. */
        comment?: {
            /** Single line comment. */
            line?: string;
            /** Single line comment. */
            block?: [string, string] | [string, string][];
        };
        /** Regex literals. */
        regex?: [string, string] | [string, string][];
    }
    /**
     * Default `Iterator.opts` for common languages.
     */
    const opts: Record<string, Config>;
    /**
     * Slice the lines of a source data into lines.
     */
    function slice_lines(source: string | {
        data: string;
    }, opts?: Config): string[];
}
export {};
