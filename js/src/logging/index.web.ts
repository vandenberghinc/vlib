import * as _pipe from "./pipe.js";
import * as _source_loc from "./source_loc.js";
import * as _loader from "./loader.js";
import * as _spinner from "./spinner.js";

export class Logging {
    static debugger = (active_log_level: number) => _pipe.pipe.debugger(active_log_level);
}
export namespace Logging {

    export const Pipe = _pipe.Pipe;
    export type Pipe = _pipe.Pipe;
    export const pipe = _pipe.pipe;
    
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