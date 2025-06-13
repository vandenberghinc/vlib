/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Path, Schema } from "../vlib/index.js";
export declare class NPM {
    source: Path;
    config_path: Path;
    config: any;
    version_path?: string;
    id: string;
    /** Constructor validator. */
    static validator: Schema.Validator<any[] | Record<string, any>, true, {
        readonly source: "string";
        readonly version_path: {
            readonly type: "string";
            readonly required: false;
        };
    }, any, any[]>;
    constructor({ source, version_path, }: {
        source: string;
        version_path?: string;
    });
    logged_in(): Promise<boolean>;
    login(): Promise<void>;
    save(): void;
    increment_version({ save }?: {
        save?: boolean | undefined;
    }): Promise<any>;
    publish({ only_if_changed, }: {
        only_if_changed?: boolean | undefined;
    }): Promise<{
        has_changed: boolean;
        live_version: string;
    }>;
    has_commits(log_level?: number, tmp_dir?: string): Promise<boolean>;
}
