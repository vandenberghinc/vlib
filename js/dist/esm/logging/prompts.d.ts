/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * {Prompt}
 * Prompt a question from the user
 * @param question The question to display
 * @returns The user's response
 */
export declare function prompt(question: string): Promise<string>;
/**
 * {Confirm}
 * Create a confirmation prompt for the user
 * @param question The question to display
 * @param yes The set of lowercased yes responses, defaults to `["y", "yes", "ok"]`.
 * @returns The user's response, yes or no.
 */
export declare function confirm(question: string, yes?: Set<string>): Promise<boolean>;
