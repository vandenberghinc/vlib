import * as _pipe from "./pipe.js";
import * as _source_loc from "./source_loc.js";
import * as _loader from "./loader.js";
import * as _spinner from "./spinner.js";
export declare class Logging {
    static debugger: (active_log_level: number) => _pipe.DebuggerFunc;
}
export declare namespace Logging {
    const Pipe: typeof _pipe.Pipe;
    type Pipe = _pipe.Pipe;
    const pipe: _pipe.Pipe;
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
