/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Path, Scheme } from "../../index.js";
export declare class NPM {
    source: Path;
    config_path: Path;
    config: any;
    version_path?: string;
    /** Constructor validator. */
    static validator: Scheme.Validator<object, object, "object">;
    constructor({ source, version_path, }: {
        source: string;
        version_path?: string;
    });
    logged_in(): Promise<boolean>;
    login(): Promise<string | undefined>;
    save(): void;
    increment_version({ save }?: {
        save?: boolean | undefined;
    }): Promise<string>;
    publish({ only_if_changed, }: {
        only_if_changed?: boolean | undefined;
    }): Promise<{
        has_changed: boolean;
        live_version: string;
    }>;
    has_commits(log_level?: number, tmp_dir?: string): Promise<boolean>;
}
