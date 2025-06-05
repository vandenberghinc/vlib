/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * A module to manage multiple active spinners.
 */
export declare namespace Spinners {
    /** The list of active spinners. */
    const active: Spinner[];
    /** Universal spinner interface which all spinners should honour. */
    interface Spinner {
        running: boolean;
        pause: () => void;
        resume: () => void;
    }
    /** Check if there is an active spinner running. */
    function has_active(): boolean;
    /**
     * Add an active spinner.
     * @param spinner The spinner to add.
     */
    function add(spinner: Spinner): void;
    /**
     * Remove an active spinner when present.
     * @param spinner The spinner to remove.
     */
    function remove(spinner: Spinner): void;
    /** Pause all running spinners */
    function pause_all(): void;
    /** Resume the last active spinner if any. */
    function resume_last(): void;
    /**
     * Almost ensure a safe print after this func is executed.
     * By resetting the last dumped line if there is an active spinner.
     */
    function ensure_safe_print(): void;
    /** Clear the current line. */
    function clear_current_line(): void;
}
export { Spinners as spinners };
