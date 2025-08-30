/**
 * @author Daan van den Bergh
 * @copyright © 2025 Daan van den Bergh. All rights reserved.
 */
import { Path, Schema } from "../vlib/index.js";
import { Git } from "./git.js";
import { NPM } from "./npm.js";
import { SSH } from "./ssh.js";
export interface Config {
    ssh: {
        remotes: {
            alias: string;
            destination: string;
            enabled: boolean;
        }[];
    };
    git: {
        username: undefined | string;
        email: undefined | string;
        remotes: {
            remote: string;
            branch: string;
            destination: string;
            enabled: boolean;
        }[];
    };
    version_path: string;
    npm?: {
        /**
         * The path or subpath to the `package.json` path, defaults to `./package.json`
         * The path will be treated as a subpath of the `source`, unless the `path` starts with a `/`.
         */
        path?: string;
        /** Developer links from npm link ... */
        links?: Record<string, string[]>;
    };
}
export declare namespace Config {
    /**
     * A generic scheme for generating the JSON schema for the repo configuration file.
     */
    const Schema: {
        readonly version_path: {
            readonly type: "string";
            readonly required: false;
        };
        readonly ssh: {
            readonly type: "object";
            readonly required: false;
            readonly schema: {
                readonly remotes: {
                    readonly type: "array";
                    readonly default: readonly [];
                    readonly value_schema: {
                        readonly type: "object";
                        readonly schema: {
                            readonly alias: "string";
                            readonly destination: "string";
                            readonly enabled: {
                                readonly type: "boolean";
                                readonly default: true;
                            };
                        };
                    };
                };
            };
        };
        readonly git: {
            readonly type: "object";
            readonly required: false;
            readonly schema: {
                readonly username: "string";
                readonly email: "string";
                readonly remotes: {
                    readonly type: "array";
                    readonly default: readonly [];
                    readonly value_schema: {
                        readonly type: "object";
                        readonly schema: {
                            readonly remote: "string";
                            readonly branch: "string";
                            readonly destination: "string";
                            readonly enabled: {
                                readonly type: "boolean";
                                readonly default: true;
                            };
                        };
                    };
                };
            };
        };
        readonly npm: {
            readonly type: "object";
            readonly required: false;
            readonly schema: {
                readonly path: {
                    readonly type: "string";
                    readonly required: false;
                    readonly default: "./package.json";
                };
                readonly links: {
                    readonly type: "object";
                    readonly required: false;
                    readonly value_schema: {
                        readonly type: "array";
                        readonly value_schema: "string";
                    };
                };
            };
        };
    };
}
export declare class Package {
    source: Path;
    name: string;
    git_enabled: boolean;
    ssh_enabled: boolean;
    npm_enabled: boolean;
    config_path: Path;
    config?: Config;
    git?: Git;
    ssh?: SSH;
    npm?: NPM;
    /** Constructor validator. */
    static validator: Schema.Validator<any[] | Record<string, any>, true, {
        readonly source: "string";
        readonly git: {
            readonly type: "boolean";
            readonly default: true;
        };
        readonly ssh: {
            readonly type: "boolean";
            readonly default: true;
        };
        readonly npm: {
            readonly type: "boolean";
            readonly default: true;
        };
    }, Schema.ValueEntries.Opts<{}>, (Schema.Entry.Type.Castable.Base | readonly Schema.Entry.Type.Castable.Base[] | {
        type?: Schema.Entry.Type.Castable.Base | readonly Schema.Entry.Type.Castable.Base[] | undefined;
        default?: any;
        required?: boolean | ((parent: any[] | Record<string, any>) => boolean) | undefined;
        allow_empty?: boolean;
        min?: number;
        max?: number;
        schema?: Record<string, Schema.Entry.Type.Castable.Base | readonly Schema.Entry.Type.Castable.Base[] | /*elided*/ any> | undefined;
        value_schema?: Schema.Entry.Type.Castable.Base | readonly Schema.Entry.Type.Castable.Base[] | /*elided*/ any | undefined;
        tuple?: (Schema.Entry.Type.Castable.Base | readonly Schema.Entry.Type.Castable.Base[] | /*elided*/ any)[] | undefined;
        enum?: readonly any[];
        alias?: string | readonly string[];
        verify?: ((attr: any, parent: any[] | Record<string, any>, key?: string | number | undefined) => string | void | null | undefined) | undefined;
        preprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        postprocess?: ((attr: any, parent: any[] | Record<string, any>, key: string | number) => any) | undefined;
        cast?: boolean | import("../vlib/types/types.js").Neverify<{
            preserve: true;
            strict?: boolean;
        } | {
            preserve?: boolean;
            strict: true;
        }, "preserve"> | import("../vlib/types/types.js").Neverify<{
            preserve: true;
            strict?: false;
        } | {
            preserve?: false;
            strict: true;
        }, "preserve"> | undefined;
        charset?: RegExp | undefined;
        field_type?: string;
        unknown?: boolean;
        readonly def?: any;
    })[]>;
    static find_config_path(cwd?: string): Path | undefined;
    constructor({ source, git, // git enabled.
    ssh, // ssh enabled.
    npm, }: {
        source: string;
        git?: boolean;
        ssh?: boolean;
        npm?: boolean;
    });
    init(): Promise<void>;
    assert_init(): asserts this is {
        config: Config;
    };
    save(): void;
}
