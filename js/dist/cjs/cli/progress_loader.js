var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var stdin_exports = {};
__export(stdin_exports, {
  ProgressLoader: () => ProgressLoader,
  default: () => stdin_default
});
module.exports = __toCommonJS(stdin_exports);
class ProgressLoader {
  message;
  steps;
  step;
  width;
  progress;
  last_progress;
  /** @docs
   *  @title: Constructor
   *  @desc: Create a new progress loader
   *  @param:
   *      @name: message
   *      @desc: The message to display before the progress bar
   *      @type: string
   *  @param:
   *      @name: steps
   *      @desc: Total number of steps in the progress
   *      @type: number
   *  @param:
   *      @name: step
   *      @desc: Current step number
   *      @type: number
   *  @param:
   *      @name: width
   *      @desc: Width of the progress bar in characters
   *      @type: number
   */
  constructor({ message = "Loading", steps = 100, step = 0, width = 10 } = {}) {
    this.message = message.trim();
    this.steps = steps;
    this.step = step;
    this.width = width;
    this.progress = 0;
    this.last_progress = null;
    this.next(false);
  }
  /** @docs
   *  @title: Next Step
   *  @desc: Advance to the next step and update the progress bar
   *  @param:
   *      @name: increment
   *      @desc: Whether to increment the step counter
   *      @type: boolean
   */
  next(increment = true) {
    if (increment) {
      ++this.step;
    }
    this.progress = this.step / this.steps;
    const fixed = (this.progress * 100).toFixed(2);
    if (fixed !== this.last_progress) {
      this.last_progress = fixed;
      const completed = Math.floor(this.progress * this.width);
      const remaining = this.width - completed;
      process.stdout.write(`\r${this.message} ${fixed}% [${"=".repeat(completed)}${".".repeat(remaining)}]${this.progress >= 1 ? "\n" : ""}`);
    }
  }
}
var stdin_default = ProgressLoader;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ProgressLoader
});
