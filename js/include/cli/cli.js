/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// CLI object.

/*  @docs:
    @chapter: CLI
    @title: CLI
    @description: Build a cli.
    @parameter:
        @name: name
        @type: string
        @description: The cli's name.
    @parameter:
        @name: description
        @type: string
        @description: The cli's description.
    @parameter:
        @name: version
        @type: string
        @description: The cli's version.
    @parameter:
        @name: notes
        @type: array[string]
        @description: The cli's notes.
    @parameter:
        @name: commands
        @type: array[object]
        @description:
            A command object looks as follows:
            ```
            {
                id: "--hello-world",
                description: "Hello world." // (optional)
                examples: { // (optional)
                    "Some description": "mycli --hello-world --name me --age 10",
                }
                args: [
                    {
                        id: "--name", // (optional)
                        type: "string", // (default)
                        required: true, // (optional).
                        default: "Hello World!", // (optional).
                        description: "Your name." // (optional)
                        ignore: false, // ignore in docs (optional)
                    },
                    {
                        id: ["--age", "-a"],  // (optional)
                        type: "number",
                        description: "Your age." // (optional)
                    },
                },
                callback: ({name = null, age = 0}) => {}
            }
            ```
            - Valid values for `type` are [`string`, `boolean` and `number`].
            - The callback arguments is the arg.id when the id is a string, or the first item of the ids when the id is an array.
              When the id is not defined then the argument will be called `arg1` or `arg2` starting from 1.
              An id like `--my-arg` will be passed as `my_arg`.
            - Field `default` is only passed when the argument has been passed to the cli but no value was defined.
              When the argument has not been passed then the default value defined in the callback parameters will be used.
 */
vlib.CLI = class CLI {

    // ---------------------------------------------------------
    // Constructor.
    constructor({
        name = "CLI",
        description = null,
        version = null,
        notes = null,
        commands = [],
        start_index = 2,
    } = {}) {
        this.name = name;
        this.description = description;
        this.version = version;
        this.commands = commands;
        this.notes = notes;
        this.start_index = start_index;
    }

    // ---------------------------------------------------------
    // Utils.

    _cast(value, type) {
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
    /*  @docs:
        @title: Get
        @description: Get an argument.
     */
    get({id, index = null, type = null, def = null, exclude_args = true}) {
        if (index != null) {
            const value = process.argv[this.start_index + index];
            if (value === undefined) {
                return {found: false, value: def};
            }
            return {found: true, value: this._cast(value, type)};
        }
        const is_array = Array.isArray(id);
        for (let i = this.start_index; i < process.argv.length; i++) {
            if ((is_array && id.includes(process.argv[i])) || (is_array === false && process.argv[i] === id)) {
                const value = process.argv[i + 1];
                if (value === undefined || (exclude_args && value.charAt(0) === "-")) {
                    return {found: true, value: def}; // keep as true since the id is found.
                }
                return {found: true, value: this._cast(value, type)};
            }
        }
        return {found: false, value: def};
    }

    // Present.
    /*  @docs:
        @title: Present
        @description: Check if an argument is present.
     */
    present(id) {
        const is_array = Array.isArray(id);
        for (let i = this.start_index; i < process.argv.length; i++) {
            if ((is_array && id.includes(process.argv[i])) || (is_array === false && process.argv[i] === id)) {
                return true;
            }
        }
        return false;
    }

    // Log an error.
    /*  @docs:
        @title: Error
        @description: Log an error.
     */
    error(...err) {
        let str = "";
        for (let i = 0; i < err.length; i++) {
            if (err[i].stack) {
                str += "\n" + err[i].stack;
            } else {
                str += err[i].toString();
            }
        }
        err = str.trim();
        if (err.eq_first("Error: ") || err.eq_first("error: ")) {
            err = err.substr(7).trim();
        }
        console.log(`${vlib.colors.red}Error${vlib.colors.end}: ${err}`)
    }

    // Throw an error and stop with exit code 1.
    /*  @docs:
        @title: Throw error
        @description: Throw an error and stop with exit code 1.
     */
    throw_error(...err) {
        this.error(...err);
        process.exit(1);
    }

    // Log the docs of an array of command or a single command.
    // When one of the commands is passed as "command_or_commands" it will show the documentation of that command, the command is passed inside the command callback as "_command".
    /*  @docs:
        @title: Docs
        @description: Log the docs, optionally of an array of command or a single command.
     */
    docs(command_or_commands = null) {
        
        // Assign to commands when undefined
        if (command_or_commands == null) {
            command_or_commands = this.commands;
        }

        // Create docs header.
        let docs = "";
        if (this.name != null) {
            docs += this.name;
        }
        if (this.version != null) {
            docs += ` v${this.version}`;
        }
        if (docs.length > 0) {
            docs += "\n";
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
                while (item[0].length < max_length + 4) {
                    item[0] += " ";
                }
                docs += item[0] + item[1];
            })
        }

        // Show docs from an array of commands.
        if (Array.isArray(command_or_commands)) {
            
            // Description.
            if (this.description) {
                docs += `\nDescription:\n    ${this.description.split("\n").join("\n    ")}\n`;
            }

            // Usage.
            docs += `Usage: $ ${this.name} [mode] [options]\n`;

            // Commands.
            let index = 0;
            let list = [];
            command_or_commands.iterate((command) => {
                const list_item = [];

                // Add command.
                if (Array.isArray(command.id)) {
                    list_item[0] = `    ${command.id.join(", ")}`;
                } else {
                    list_item[0] = `    ${command.id}`;
                }
                if (command.description != null) {
                    list_item[1] = command.description;
                }
                list_item[1] += "\n";
                list.push(list_item);

                // Add command args.
                if (command.args.length > 0) {
                    let arg_index = 0;
                    command.args.iterate((arg) => {
                        if (arg.ignore === true) {
                            return ;
                        }
                        const list_item = [];
                        if (arg.id == null) {
                            list_item[0] = `        argument ${arg_index}`;
                        }
                        else if (Array.isArray(arg.id)) {
                            list_item[0] = `        ${arg.id.join(", ")}`;
                        } else {
                            list_item[0] = `        ${arg.id}`;
                        }
                        if (arg.type != null && arg.type !== "bool" && arg.type !== "boolean") {
                            list_item[0] += ` <${arg.type}>`;
                        }
                        if (arg.required === true) {
                            list_item[0] += " (required)";
                        }
                        if (arg.description != null) {
                            list_item[1] = arg.description;
                        }
                        list_item[1] += "\n";
                        list.push(list_item);
                        ++arg_index;
                    })
                }
            })
            list.push([
                "    --help, -h",
                "Show the overall documentation or when used in combination with a command, show the documentation for a certain command.",
            ])
            add_keys_and_values(list);

            // Remove last newline.
            if (docs.charAt(docs.length - 1) === "\n") {
                docs = docs.substr(0, docs.length - 1);
            }

            // Notes.
            if (this.notes && this.notes.length > 0) {
                docs += `\nNotes:\n`;
                this.notes.iterate((note) => {
                    docs += ` * ${note}\n`;
                })
            }

            // Remove last newline.
            if (docs.charAt(docs.length - 1) === "\n") {
                docs = docs.substr(0, docs.length - 1);
            }
        }

        // Show detailed docs from a specific command.
        else {

            // Description.
            if (this.description) {
                docs += this.description + "\n";
            }

            // Usage.
            docs += `Usage: $ ${this.name} ${command_or_commands.id} [options]\n`;

            // Description.
            if (command_or_commands.description) {
                docs += `\n`;
                docs += command_or_commands.description;
                docs += `\n`;
            }

            // Arguments.
            if (command_or_commands.args.length > 0) {
                docs += `\nOptions:\n`;
                let arg_index = 0;
                const list = [];
                command_or_commands.args.iterate((arg) => {
                    if (arg.ignore === true) {
                        return ;
                    }
                    const list_item = [];
                    if (arg.id == null) {
                        list_item[0] = `    argument ${arg_index}`;
                    }
                    else if (Array.isArray(arg.id)) {
                        list_item[0] = `    ${arg.id.join(", ")}`;
                    } else {
                        list_item[0] = `    ${arg.id}`;
                    }
                    if (arg.type != null && arg.type !== "bool" && arg.type !== "boolean") {
                        list_item[0] += ` <${arg.type}>`;
                    }
                    if (arg.required === true) {
                        list_item[0] += " (required)";
                    }
                    if (arg.description != null) {
                        list_item[1] = arg.description;
                    }
                    list_item[1] += "\n";
                    list.push(list_item);
                    ++arg_index;
                })
                add_keys_and_values(list);
            }

            // Examples.
            if (command_or_commands.examples != null) {
                docs += `\nExamples:\n`;
                if (typeof command_or_commands.examples === "string") {
                    if (command_or_commands.examples.charAt(0) === "$") {
                        docs += `    ${vlib.colors.italic}${command_or_commands.examples}${vlib.colors.end}\n`;
                    } else {
                        docs += `    ${vlib.colors.italic}$ ${command_or_commands.examples}${vlib.colors.end}\n`;
                    }
                }
                else if (Array.isArray(command_or_commands.examples)) {
                    command_or_commands.examples.iterate((item) => {
                        if (item.charAt(0) === "$") {
                            docs += `    ${vlib.colors.italic}${item}${vlib.colors.end}\n`;
                        } else {
                            docs += `    ${vlib.colors.italic}$ ${item}${vlib.colors.end}\n`;
                        }
                    })
                }
                else if (typeof command_or_commands.examples === "command_or_commandsect") {
                    const descs = Object.keys(command_or_commands.examples);
                    const list = [];
                    descs.iterate((desc) => {
                        const list_item = [`    ${desc}:`];
                        const example = command_or_commands.examples[desc];
                        if (example.charAt(0) === "$") {
                            list_item[1] = `${vlib.colors.italic}${example}${vlib.colors.end}\n`;
                        } else {
                            list_item[1] = `${vlib.colors.italic}$ ${example}${vlib.colors.end}\n`;
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
    /*  @docs:
        @title: Start
        @description: Start the cli.
     */
    async start() {

        const help = this.present(["-h", "--help"])
        let matched = false;
        for (let i = 0; i < this.commands.length; i++) {
            const command = this.commands[i];
            if (this.present(command.id)) {

                // Show command help.
                if (help) {
                    this.docs(command);
                    return true;
                }

                // Get arguments.
                const callback_args = {_command: command};
                let arg_index = 0;
                const err = command.args.iterate((arg) => {
                    try {

                        // Convert arg id name.
                        let id_name;
                        if (arg.id == null) {
                            id_name = `arg${arg_index}`;
                        } else {
                            id_name = arg.id;
                            if (Array.isArray(id_name)) {
                                id_name = id_name[0];
                            }
                            while (id_name.length > 0 && id_name[0] == "-") {
                                id_name = id_name.substr(1);
                            }
                            id_name = id_name.replaceAll("-", "_");
                            if (id_name == "") {
                                return `Invalid argument id "${arg.id}".`;
                            }
                        }

                        // Type bool.
                        if (arg.type === "bool" || arg.type === "boolean") {
                            callback_args[id_name] = this.present(arg.id)
                        }

                        // Get and cast.
                        else {
                            let {found, value} = this.get({
                                id: arg.id,
                                index: arg.id == null ? arg_index : null,
                                type: arg.type, 
                                def: undefined,
                            });
                            if (found === false && arg.required === true) {
                                return `Define parameter "${arg.id}".`;
                            }
                            if (found === true && value == null && arg.default !== undefined) {
                                value = arg.default;
                            }
                            if (value != null) {
                                callback_args[id_name] = value;
                            }
                        }
                    }

                    // Handle error.
                    catch (err) {
                        return err;
                    }
                    ++arg_index;
                })

                // Show command docs on error.
                if (err) {
                    this.docs(command);
                    this.error(err);
                    return true;
                }

                // Call the callback.
                try {
                    const res = command.callback(callback_args);
                    if (res instanceof Promise) {
                        await res;
                    }
                } catch (err) {
                    this.docs(command);
                    this.error(err);
                    process.exit(1);
                }

                // Set to matched.
                matched = true;
                break;
            }
        }

        // Show help.
        if (!matched && help) {
            this.docs();
            return true;
        }

        // Show default docs.
        if (!matched) {
            this.docs();
            this.error("Invalid mode.");
            return false;
        }
        return true;
    }

}

// Static cli module.
vlib.cli = {};

// Get an argument.
/*  @docs:
    @chapter: CLI
    @title: Get
    @description: Get an argument.
 */
vlib.cli.get = function({id, index = null, type = null, def = null, exclude_args = true}) {
    if (this._cli === undefined) {
        this._cli = new vlib.CLI();
    }
    return this._cli.get({id, index, type, def, exclude_args}).value;
}

// Present.
/*  @docs:
    @chapter: CLI
    @title: Present
    @description: Check if an argument is present.
 */
vlib.cli.present = function(id) {
    if (this._cli === undefined) {
        this._cli = new vlib.CLI();
    }
    return this._cli.present(id);
}