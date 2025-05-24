/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/** @docs
 *  @title: Progress Loader
 *  @desc: A command line progress loader with customizable width and steps
 */
export declare class ProgressLoader {
    private message;
    private steps;
    private step;
    private width;
    private progress;
    private last_progress;
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
    constructor({ message, steps, step, width }?: {
        message?: string;
        steps?: number;
        step?: number;
        width?: number;
    });
    /** @docs
     *  @title: Next Step
     *  @desc: Advance to the next step and update the progress bar
     *  @param:
     *      @name: increment
     *      @desc: Whether to increment the step counter
     *      @type: boolean
     */
    next(increment?: boolean): void;
}
export default ProgressLoader;
