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
export declare class CodeIterator {
    /** The current state. */
    state: CodeIterator.State;
    /** The iterator options, keep it optionally undefined so we can perform a fast check if there are no options defined. */
    opts: undefined | {
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
    };
    /** Constructor. */
    constructor(
    /** The compiler state. */
    state: string | CodeIterator.Source | Partial<Omit<CodeIterator.State, "source">> & {
        source: CodeIterator.Source;
    }, 
    /** Instantly throw an error when a diagnostic is encountered, useful for debugging. */
    opts?: CodeIterator["opts"], 
    /**
     * Optionally pass a callback and walk the iterator when invoking the constructor.
     * Advancing the iterator inside the callback is allowed.
     */
    callback?: (state: CodeIterator.State, it: CodeIterator) => void);
    /** Advance a single character, tracking contexts. */
    advance(): void;
    /** Advance a number of positions. */
    advance_n(n: number): void;
    /** Peek characters/ */
    peek(adjust?: number): string;
    peek_next(): string;
    peek_prev(): string;
    char(adjust?: number): string;
    next(): string;
    prev(): string;
    /** Has more content */
    avail(): boolean;
    more(): boolean;
    has(): boolean;
    /** Is inline whitespace (excluding line breaks). */
    is_inline_whitespace(): boolean;
    /** Is at end of line. */
    is_eol(): boolean;
    /** Is at end of file. */
    is_eof(): boolean;
    /** checks if the current char is excluded by previous \.  */
    is_excluded(): boolean;
    /** Is a char allowed in a variable name so [a-zA-Z0-9_] */
    is_variable_char(c: string): boolean;
    /** Starts with check at current position */
    match_prefix(s: string): boolean;
    /** Consume a string match. */
    consume_optional(s: string): void;
    /** Consume inline whitespace (excluding line breaks). */
    consume_inline_whitespace(): void;
    /** Consume whitespace (including line breaks). */
    consume_whitespace(): void;
    /** Consume while. */
    consume_while(fn: CodeIterator.ConsumeWhileFn, slice: true): string;
    consume_while(fn: CodeIterator.ConsumeWhileFn, slice?: boolean): void;
    /** Consume whle with special code opts. */
    consume_code_while(fn: CodeIterator.ConsumeCodeWhileFn, slice: true): string;
    consume_code_while(fn: CodeIterator.ConsumeCodeWhileFn, slice?: boolean): void;
    /** Consume util. */
    consume_until(fn: CodeIterator.ConsumeWhileFn, slice: true): string;
    consume_until(fn: CodeIterator.ConsumeWhileFn, slice?: boolean): void;
    consume_code_until(fn: CodeIterator.ConsumeCodeWhileFn, slice: true): string;
    consume_code_until(fn: CodeIterator.ConsumeCodeWhileFn, slice?: boolean): void;
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
/** Code iterator types. */
export declare namespace CodeIterator {
    /**
     * We use a source file for the iterator state so we can perform shallow copies of states.
     * Without copying the entire data string.
     */
    interface Source {
        /** The data string. */
        data: string;
    }
    /**
     * Relative compiler state.
     * Note that the state is mutable and is changed during the iteration.
     */
    class State {
        /** The relative source file. */
        source: Source;
        /** The absolute source file, in case the iterator is part of a parent iterator. Can be used to still resolve line & cols from nested iterations. */
        abs_source: Source;
        /** Length of the source data */
        len: number;
        /** Current relative offset position in the source data */
        offset: number;
        /** The nested offset in case `abs_source` is not `source`, can be used to still resolve line & cols from nested iterations. */
        nested_offset: number;
        /** Current line number. */
        line: number;
        /** Current column number. */
        col: number;
        /** Is at the start of line (excluding whitespace). */
        at_sof: boolean;
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
        at_sof: boolean, 
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
        /** Is code, not string, comment or regex. */
        get is_code(): boolean;
        /** Get absolute offset. */
        get abs_offset(): number;
        /** Create a (semi-deep) copy of all attributes except for the `source` and `abs_source` attributes. */
        copy(): CodeIterator.State;
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
}
