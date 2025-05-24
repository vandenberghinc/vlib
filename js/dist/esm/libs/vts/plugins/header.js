/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
/**
 * Add/update @author and @copyright to the top of the source file.
 * When already present then replace the content.
 * Ensure we keep the start year
 */
export async function header_plugin(path, author, start_year) {
    const current_year = new Date().getFullYear();
    const header_regex = /^\/\*\*[\s\S]*?\*\//;
    const copyright = `© ${start_year == null
        ? current_year
        : `${start_year} - ${current_year}`} ${author}. All rights reserved.`;
    const data = await path.load();
    let new_data = data;
    const match = data.match(header_regex);
    if (match) {
        const existing_header = match[0];
        // Replace only the author and copyright lines
        const updated_header = existing_header
            .replace(/@author\s.*$/m, `@author ${author}`)
            .replace(/@copyright\s.*$/m, `@copyright ${copyright}`);
        new_data = data.replace(existing_header, updated_header);
    }
    else {
        // No existing header, prepend new one
        new_data = "/**\n" +
            ` * @author ${author}\n` +
            ` * @copyright ${copyright}\n` +
            " */\n" +
            data;
    }
    await path.save(new_data);
}
//# sourceMappingURL=header.js.map