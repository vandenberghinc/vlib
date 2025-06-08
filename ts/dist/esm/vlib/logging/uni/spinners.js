/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * A module to manage multiple active spinners.
 */
export var Spinners;
(function (Spinners) {
    /** The list of active spinners (multi type but for now just one). */
    Spinners.active = [];
    /** Check if there is an active spinner running. */
    function has_active() {
        return Spinners.active.some(spinner => spinner.running);
    }
    Spinners.has_active = has_active;
    /**
     * Add an active spinner.
     * @param spinner The spinner to add.
     */
    function add(spinner) {
        Spinners.active.push(spinner);
    }
    Spinners.add = add;
    /**
     * Remove an active spinner when present.
     * @param spinner The spinner to remove.
     */
    function remove(spinner) {
        const index = Spinners.active.indexOf(spinner);
        if (index !== -1) {
            Spinners.active.splice(index, 1);
        }
    }
    Spinners.remove = remove;
    /** Pause all running spinners */
    function pause_all() {
        for (const spinner of Spinners.active) {
            if (spinner.running) {
                spinner.pause();
            }
        }
    }
    Spinners.pause_all = pause_all;
    /** Resume the last active spinner if any. */
    function resume_last() {
        if (Spinners.active.length > 0) {
            const last_spinner = Spinners.active[Spinners.active.length - 1];
            if (!last_spinner.running) {
                last_spinner.resume();
            }
        }
    }
    Spinners.resume_last = resume_last;
    /**
     * Almost ensure a safe print after this func is executed.
     * By resetting the last dumped line if there is an active spinner.
     */
    function ensure_safe_print() {
        if (Spinners.active.some(spinner => spinner.running)) {
            clear_current_line();
        }
    }
    Spinners.ensure_safe_print = ensure_safe_print;
    /** Clear the current line. */
    function clear_current_line() {
        process.stdout.write('\r\x1b[K'); // Clear the current line
    }
    Spinners.clear_current_line = clear_current_line;
})(Spinners || (Spinners = {}));
export { Spinners as spinners }; // snake_case compatibility.
//# sourceMappingURL=spinners.js.map