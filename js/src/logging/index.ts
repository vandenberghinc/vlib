import * as _logger from "./logger.js";
import * as _terminal_divider from "./terminal_divider.js";
import * as _source_loc from "./source_loc.js";
import * as _loader from "./loader.js";
import * as _spinner from "./spinner.js";

export namespace Logging {
    
    export const terminal_divider = _terminal_divider.terminal_divider;

    export const Logger = _logger.Logger;
    export type Logger = _logger.Logger;

    export const logger = _logger.logger;

    export const SourceLoc = _source_loc.SourceLoc;
    export type SourceLoc = _source_loc.SourceLoc;

    export const Loader = _loader.Loader;
    export type Loader = _loader.Loader;

    export const Spinner = _spinner.Spinner;
    export type Spinner = _spinner.Spinner;

}
export { Logging as logging };

// Re-export the logger as well.
export * from "./logger.js"
export { SourceLoc } from "./source_loc.js"