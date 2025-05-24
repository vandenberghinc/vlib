import * as _logger from "./logger.js";
import * as _terminal_divider from "./terminal_divider.js";
import * as _source_loc from "./source_loc.js";
import * as _loader from "./loader.js";
import * as _spinner from "./spinner.js";
export declare namespace Logging {
    const terminal_divider: typeof _terminal_divider.terminal_divider;
    const Logger: typeof _logger.Logger;
    type Logger = _logger.Logger;
    const logger: _logger.Logger;
    const SourceLoc: typeof _source_loc.SourceLoc;
    type SourceLoc = _source_loc.SourceLoc;
    const Loader: typeof _loader.Loader;
    type Loader = _loader.Loader;
    const Spinner: typeof _spinner.Spinner;
    type Spinner = _spinner.Spinner;
}
export { Logging as logging };
export * from "./logger.js";
export { SourceLoc } from "./source_loc.js";
