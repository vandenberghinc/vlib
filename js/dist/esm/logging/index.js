import * as _logger from "./logger.js";
import * as _terminal_divider from "./terminal_divider.js";
import * as _source_loc from "./source_loc.js";
import * as _loader from "./loader.js";
import * as _spinner from "./spinner.js";
export var Logging;
(function (Logging) {
    Logging.terminal_divider = _terminal_divider.terminal_divider;
    Logging.Logger = _logger.Logger;
    Logging.logger = _logger.logger;
    Logging.SourceLoc = _source_loc.SourceLoc;
    Logging.Loader = _loader.Loader;
    Logging.Spinner = _spinner.Spinner;
})(Logging || (Logging = {}));
export { Logging as logging };
// Re-export the logger as well.
export * from "./logger.js";
export { SourceLoc } from "./source_loc.js";
//# sourceMappingURL=index.js.map