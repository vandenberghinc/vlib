/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

/** @docs
 *  @title: Progress Loader
 *  @desc: A command line progress loader with customizable width and steps
 */
export class ProgressLoader {
    private message: string;
    private steps: number;
    private step: number;
    private width: number;
    private progress: number;
    private last_progress: string | null;

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
    constructor(
    	{
	        message = "Loading",
	        steps = 100,
	        step = 0,
	        width = 10
	    }: {
		    message?: string;
		    steps?: number;
		    step?: number;
		    width?: number;
		} = {}
	) {
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
    public next(increment: boolean = true): void {
        if (increment) {
            ++this.step;
        }
        this.progress = this.step / this.steps;
        const fixed = (this.progress * 100).toFixed(2);
        
        if (fixed !== this.last_progress) {
            this.last_progress = fixed;
            const completed = Math.floor(this.progress * this.width);
            const remaining = this.width - completed;
            process.stdout.write(
                `\r${this.message} ${fixed}% [${"=".repeat(completed)}${".".repeat(remaining)}]${this.progress >= 1 ? '\n' : ''}`
            );
        }
    }
}

export default ProgressLoader;
