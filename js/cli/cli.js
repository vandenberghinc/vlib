/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// CLI object (static).

class CLI {

    // ---------------------------------------------------------
    // Attributes.

    static start_index = 2;

    // ---------------------------------------------------------
    // Utils.

    static _cast(value, type) {
        if (type == null) {
            return value;
        }
        else if (type === "string") {
            if (typeof value !== "string") {
                value = value.toString();
            }
            return value;
        }
        else if (type === "number") {
            if (typeof value !== "number") {
                const new_value = parseFloat(value);
                if (isNaN(new_value)) {
                    throw Error(`Unable to cast "${value}" to a "number".`);
                }
                return new_value;
            }
            return value;
        }
        // else if (type === "object") {
        //     if (typeof value !== "object") {
        //         if (value.length === 0) {
        //             return {};
        //         }
        //         if (value.charAt(value.length - 1) === ",") {
        //             value = value.substr(0, value.length - 1);
        //         }
        //         return JSON.parse(`{${value}}`);
        //     }
        //     return value;
        else if (type === "array") {
            if (!Array.isArray(value)) {
                value = value.split(",");
            }
            return value;
        }
        else {
            throw Error(`Unsupported cast type "${type}".`);
        }
    }

    // ---------------------------------------------------------
    // Functions.

    // Get an argument.
    static get({id, index = null, type = null, def = null, exclude_args = true}) {
        if (index != null) {
            const value = process.argv[CLI.start_index + index];
            if (value === undefined) {
                return def;
            }
            return CLI._cast(value, type);
        }
        const is_array = Array.isArray(id);
        for (let i = CLI.start_index; i < process.argv.length; i++) {
            if ((is_array && id.includes(process.argv[i])) || (is_array === false && process.argv[i] === id)) {
                const value = process.argv[i + 1];
                if (value === undefined || (exclude_args && value.charAt(0) === "-")) {
                    return def;
                }
                return CLI._cast(value, type);
            }
        }
        return def;
    }

    // Present.
    static present(id) {
        const is_array = Array.isArray(id);
        for (let i = CLI.start_index; i < process.argv.length; i++) {
            if ((is_array && id.includes(process.argv[i])) || (is_array === false && process.argv[i] === id)) {
                return true;
            }
        }
        return false;
    }

    // Log an error.
    static error(err) {
        console.log(`\x1b[31mError\x1b[0m: ${err.trim()}`)
    }

    // Log the docs of an array of command or a single command.
    static docs(name, version, obj) {

        // Create docs header.
        let docs = "";
        if (name != null) {
            docs += name;
        }
        if (version != null) {
            docs += ` v${version}`;
        }
        if (docs.length > 0) {
            docs += ".\n";
        }

        // Add an array of keys and values to the docs with the correct whitespace indent.
        const add_keys_and_values = (list) => {
            let max_length = 0;
            list.iterate((item) => {
                if (item[0].length > max_length) {
                    max_length = item[0].length;
                }
            })
            list.iterate((item) => {
                while (item[0].length < max_length + 1) {
                    item[0] += " ";
                }
                docs += item[0] + item[1];
            })
        }

        // Show docs from an array of commands.
        if (Array.isArray(obj)) {
            docs += `Usage: $ ${name} [mode] [options]\n`;
            let index = 0;
            let list = [];
            obj.iterate((command) => {
                docs += "    ";
                const list_item = [];
                if (Array.isArray(command.id)) {
                    list_item[0] = command.id.join(", ");
                } else {
                    list_item[0] = command.id;
                }
                if (command.description != null) {
                    list_item[0] += ":";
                    list_item[1] = command.description;
                }
                list_item[1] += "\n";
                list.push(list_item);
            })
            list.push([
                "--help, -h: ",
                "Show the overall documentation or when used in combination with a command, show the documentation for a certain command.",
            ])
            add_keys_and_values(list);
        }

        // Show detailed docs from a specific command.
        else {

            // Usage.
            docs += `Usage: $ ${name} ${obj.id} [options]\n`;

            // Description.
            if (obj.description) {
                docs += `\n`;
                docs += obj.description;
                docs += `\n`;
            }

            // Arguments.
            if (obj.args.length > 0) {
                docs += `\nOptions:\n`;
                let arg_index = 0;
                const list = [];
                obj.args.iterate((arg) => {
                    const list_item = [];
                    if (arg.id == null) {
                        list_item[0] = `    argument ${arg_index}`;
                    }
                    else if (Array.isArray(arg.id)) {
                        list_item[0] = `    ${arg.id.join(", ")}`;
                    } else {
                        list_item[0] = `    ${arg.id}`;
                    }
                    if (arg.type != null) {
                        list_item[0] += ` <${arg.type}>`;
                    }
                    if (arg.description != null) {
                        list_item[0] += ":";
                        list_item[1] = arg.description;
                    }
                    list_item[1] += "\n";
                    list.push(list_item);
                    ++arg_index;
                })
                add_keys_and_values(list);
            }

            // Examples.
            if (obj.examples != null) {
                docs += `\nExamples:\n`;
                if (typeof obj.examples === "string") {
                    if (obj.examples.charAt(0) === "$") {
                        docs += `    \x1b[3m${obj.examples}\x1b[0m\n`;
                    } else {
                        docs += `    \x1b[3m$ ${obj.examples}\x1b[0m\n`;
                    }
                }
                else if (Array.isArray(obj.examples)) {
                    obj.examples.iterate((item) => {
                        if (item.charAt(0) === "$") {
                            docs += `    \x1b[3m${item}\x1b[0m\n`;
                        } else {
                            docs += `    \x1b[3m$ ${item}\x1b[0m\n`;
                        }
                    })
                }
                else if (typeof obj.examples === "object") {
                    const descs = Object.keys(obj.examples);
                    const list = [];
                    descs.iterate((desc) => {
                        const list_item = [`    ${desc}:`];
                        const example = obj.examples[desc];
                        if (example.charAt(0) === "$") {
                            list_item[1] = `\x1b[3m${example}\x1b[0m\n`;
                        } else {
                            list_item[1] = `\x1b[3m$ ${example}\x1b[0m\n`;
                        }
                        list.push(list_item);
                    })   
                    add_keys_and_values(list);
                }
            }

            // Remove last newline.
            if (docs.charAt(docs.length - 1) === "\n") {
                docs = docs.substr(0, docs.length - 1);
            }
        }

        // Log docs.
        console.log(docs);
    }

    // Build.
    /*  @docs: {
     *  @title: Build
     *  @description: Build a cli.
     *  @description: {
     *      @parameter: commands
     *      @type: string
     *      @description: The cli's name.
     *  }
     *  @description: {
     *      @parameter: version
     *      @type: string
     *      @description: The cli's version.
     *  }
     *  @description: {
     *      @parameter: commands
     *      @type: array[object]
     *      @description:
     *          A command object looks as follows:
     *          {
     *              id: "--hello-world",
     *              description: "Hello world." // (optional)
     *              examples: { // (optional)
     *                  "Some description": "mycli --hello-world --name me --age 10",
     *              }
     *              args: [
     *                  {
     *                      id: "--name", // (optional)
     *                      type: "string", // (default)
     *                      required: true, // (optional).
     *                      description: "Your name." // (optional)
     *                  },
     *                  {
     *                      id: ["--age", "-a"],  // (optional)
     *                      type: "number",
     *                      description: "Your age." // (optional)
     *                  },
     *              },
     *              callback: ({name = null, age = 0}) => {}
     *          }
     *          Valid values for `type` are `string` and `number`.
     *  }
     } */
    static build({
        name = null,
        version = null,
        commands = []
    }) {
        const help = CLI.present(["-h", "--help"])
        const matched = commands.iterate((command) => {
            if (CLI.present(command.id)) {

                // Show command help.
                if (help) {
                    CLI.docs(name, version, command);
                    return true;
                }

                // Get arguments.
                const callback_args = {};
                let arg_index = 0;
                const err = command.args.iterate((arg) => {
                    try {
                        const value = CLI.get({
                            id: arg.id,
                            index: arg.id == null ? arg_index : null,
                            type: arg.type, 
                            default: undefined
                        });
                        if (arg.required && value === undefined) {
                            return `Define parameter "${id}".`;
                        }
                        if (value !== undefined) {
                            callback_args[id] = value;
                        }
                    } catch (err) {
                        err;
                    }
                    ++arg_index;
                })

                // Show command docs on error.
                if (err) {
                    CLI.error(err);
                    CLI.docs(name, version, command);
                    return true;
                }

                // Call the callback.
                command.callback(callback_args);

                // Set to matched.
                return true;
            }
        })

        // Show help.
        if (!matched && help) {
            CLI.docs(name, version, commands);
            return true;
        }

        // Show default docs.
        if (!matched) {
            CLI.error("Invalid mode.");
            CLI.docs(name, version, commands);
            return false;
        }
        return true;
    }

}

// ---------------------------------------------------------
// Exports.

module.exports = CLI;
