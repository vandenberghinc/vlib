/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 © 2024 - 2024 Daan van den Bergh.
 */
import { Path, Proc } from "../../index.js";
import { Ignore } from 'ignore';
export declare class Git {
    source: Path;
    username: string;
    email: string;
    gitignore: Ignore;
    proc: Proc;
    constructor({ source, username, email, version_path, }: {
        source: string;
        username: string;
        email: string;
        version_path?: string;
    });
    _git_prepare(remote: string, dest: string, branch: string): Promise<string | undefined>;
    push({ remote, dest, branch, forced, ensure_push, log_level, }: {
        remote: string;
        dest: string;
        branch: string;
        forced?: boolean;
        ensure_push?: boolean;
        log_level?: number;
    }): Promise<string | undefined>;
    pull({ remote, dest, branch, forced }: {
        remote: string;
        dest: string;
        branch: string;
        forced?: boolean;
    }): Promise<string | undefined>;
    remove_commit_history({ branch }: {
        branch: string;
    }): Promise<string | undefined>;
    remove_cache(): Promise<string | undefined>;
    is_ignored(path: Path | string, _is_relative?: boolean): boolean;
    list_large_files({ exclude, limit, gitignore, directories }: {
        exclude?: string[];
        limit?: number;
        gitignore?: boolean;
        directories?: boolean;
    }): Promise<{
        path: Path;
        size: number;
    }[]>;
}
