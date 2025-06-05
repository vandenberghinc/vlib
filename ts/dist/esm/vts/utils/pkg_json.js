/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */
import { Path } from "../../vlib/index.js";
export function load_pkg_json(path, opts) {
    if (typeof path === "string") {
        path = new Path(path);
    }
    if (!path.exists()) {
        if (opts?.throw === false) {
            return undefined;
        }
        throw new Error(`Package.json "${path.str()}" does not exist.`);
    }
    const pkg_data = path.load_sync({ type: "object" });
    if (opts?.version && !pkg_data.version) {
        if (opts?.throw === false) {
            return undefined;
        }
        throw new Error(`Package.json "${path.str()}" does not contain a version.`);
    }
    return pkg_data;
}
export function resolve_pkg_json(path, opts) {
    if (typeof path === "string") {
        path = new Path(path);
    }
    if (path.full_name() === "package.json") {
        return path;
    }
    let base = path;
    while ((base = base?.base())
        && !base.join("package.json").exists()) { }
    const pkg_json = base?.join("package.json");
    if (!pkg_json || !pkg_json.exists()) {
        if (opts?.throw === false) {
            return undefined;
        }
        throw new Error(`No package.json file found in path "${path.str()}".`);
    }
    return pkg_json;
}
//# sourceMappingURL=pkg_json.js.map