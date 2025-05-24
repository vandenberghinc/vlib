import * as _pipe from "./pipe.js";
import * as _source_loc from "./source_loc.js";
import * as _loader from "./loader.js";
import * as _spinner from "./spinner.js";
export class Logging {
    static debugger = (active_log_level) => _pipe.pipe.debugger(active_log_level);
}
(function (Logging) {
    Logging.Pipe = _pipe.Pipe;
    Logging.pipe = _pipe.pipe;
    Logging.SourceLoc = _source_loc.SourceLoc;
    Logging.Loader = _loader.Loader;
    Logging.Spinner = _spinner.Spinner;
})(Logging || (Logging = {}));
export { Logging as logging };
// Re-export the logger as well.
export * from "./logger.js";
export { SourceLoc } from "./source_loc.js";
//# sourceMappingURL=index.web.js.map