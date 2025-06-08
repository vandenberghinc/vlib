/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

import * as readline from 'readline';

/** 
 * {Prompt}
 * Prompt a question from the user
 * @param question The question to display
 * @returns The user's response
 */
export async function prompt(question: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const int = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        int.on('SIGINT', () => {
            int.close();
            reject(new Error("Interrupted by user [SIGINT]."));
        });
        try {
            int.question(question, (name) => {
                int.close();
                resolve(name);
            });
        } catch (e) {
            reject(e);
        }
    })
}

// Default yes responses for the confirmation prompt.
const yes_set = new Set(["y", "yes", "ok"]);

/** 
 * {Confirm}
 * Create a confirmation prompt for the user
 * @param question The question to display
 * @param yes The set of lowercased yes responses, defaults to `["y", "yes", "ok"]`.
 * @returns The user's response, yes or no.
 */
export async function confirm(question: string, yes = yes_set): Promise<boolean> {
    return yes_set.has((await prompt(question + " (y/n) ")).toLowerCase().trim());
}