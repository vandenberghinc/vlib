
/**
 * Returnss a line of `char` repeated to fill the terminal width.
 * @param char The character to repeat.
 * @param default_size The default size to use if the terminal width cannot be determined.
 */
export function terminal_divider(char = '=', default_size = 80) {
    // Determine width: prefer .columns, then .getWindowSize(), then default 80
    const width =
        process.stdout.columns
        || (process.stdout.isTTY && process.stdout.getWindowSize && process.stdout.getWindowSize()[1])
        || default_size;
    return char.repeat(width);
}