/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

/**
 * A module to manage multiple active spinners.
 */
export namespace Spinners {

    /** The list of active spinners. */
    export const active: Spinner[] = [];

    /** Universal spinner interface which all spinners should honour. */
    export interface Spinner {
        running: boolean;
        pause: () => void;
        resume: () => void;
    }

    /** Check if there is an active spinner running. */
    export function has_active(): boolean {
        return active.some(spinner => spinner.running);
    }

    /**
     * Add an active spinner.
     * @param spinner The spinner to add.
     */
    export function add(spinner: Spinner): void {
        active.push(spinner);
    }

    /** 
     * Remove an active spinner when present.
     * @param spinner The spinner to remove.
     */
    export function remove(spinner: Spinner): void {
        const index = active.indexOf(spinner);
        if (index !== -1) {
            active.splice(index, 1);
        }
    }

    /** Pause all running spinners */
    export function pause_all(): void {
        for (const spinner of active) {
            if (spinner.running) {
                spinner.pause();
            }
        }
    }

    /** Resume the last active spinner if any. */
    export function resume_last(): void {
        if (active.length > 0) {
            const last_spinner = active[active.length - 1];
            if (!last_spinner.running) {
                last_spinner.resume();
            }
        }
    }

    /**
     * Almost ensure a safe print after this func is executed.
     * By resetting the last dumped line if there is an active spinner.
     */
    export function ensure_safe_print(): void {
        if (active.some(spinner => spinner.running)) {
            clear_current_line();
        }
    }

    /** Clear the current line. */
    export function clear_current_line(): void {
        process.stdout.write('\r\x1b[K'); // Clear the current line
    }

}
export { Spinners as spinners }; // snake_case compatibility.