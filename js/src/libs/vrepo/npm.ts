/**
 * @author Daan van den Bergh
 * @copyright © 2024 - 2025 Daan van den Bergh. All rights reserved.
 */

// Imports.
import { execSync } from 'child_process';
import crypto from 'crypto';
import { Path, Scheme, Proc } from "../../index.js"

// ---------------------------------------------------------
// The npm class.

export class NPM {

    source: Path;
    config_path: Path;
    config: any;
    version_path?: string;

    // Constructor.
    constructor({
        source,
        version_path = undefined,
    }: {
        source: string,
        version_path?: string,
    }) {

        // Verify arguments.
        Scheme.verify({
            object: arguments[0],
            strict: true,
            scheme: {
                source: "string",
                version_path: {type: "string", required: false},
            },
        })

        // Parameters.
        this.source = new Path(source);

        // Config file.
        this.config_path = this.source.join(`/package.json`);
        if (!this.config_path.exists()) {
            throw new Error(`NPM configuration file "${this.config_path.str()}" does not exist.`);
        }
        this.config = JSON.parse(this.config_path.load_sync());
    }

    // Check if the user is logged in.
    async logged_in() {
        return new Promise<boolean>(async (resolve) => {
            const proc = new Proc();
            await proc.start({
                command: "npm",
                args: ["whoami"],
                working_directory: this.source.str(),
                interactive: false,
            })
            if (proc.exit_status !== 0) {
                return resolve(false);
            }
            resolve(true);
            // resolve(proc.out.trim() == this.username);
        });
    }

    // Log a user in.
    async login() {
        return new Promise<string | undefined>(async (resolve, reject) => {
            const logged_in = await this.logged_in();
            if (logged_in === false) {
                return reject("No npm user is logged in, execute ($ npm login).")
                // const proc = new vlib.Proc({debug: true});
                // await proc.start({
                //     command: "npm",
                //     args: ["login"],
                //     working_directory: this.source.str(),
                //     interactive: true,
                // })
                // if (proc.exit_status !== 0) {
                //     return reject(proc.err);
                // }
            }
            resolve(undefined);
        });
    }

    // Save the config.
    save() {
        this.config_path.save_sync(JSON.stringify(this.config, null, 4));
    }

    // Increment the version.
    async increment_version({save = true} = {}) {
        return new Promise<string>(async (resolve, reject) => {
            try {

                // Increment the version in package.json.
                let version = this.config.version;
                if (version === undefined) {
                    version = "1.0.0";
                } else {
                    const split = version.split(".").map((x) => parseInt(x));

                    // Only increase the last digit from the version.
                    split[split.length - 1] += 1;

                    // Increase the version and continue one digit to the left when a digit has reached 9.
                    // for (let i = split.length - 1; i >= 0; i--) {
                    //     if (i > 0) {
                    //         if (split[i] < 9) {
                    //             ++split[i];
                    //             break;
                    //         } else {
                    //             split[i] = 0;
                    //         }
                    //     } else if (i === 0) {
                    //         ++split[i];
                    //         break;
                    //     }
                    // }

                    version = split.join(".");
                }
                if (save) {
                    this.config.version = version;
                    this.save();
                }

                // Resolve.
                resolve(version);
            } catch(err) {
                return reject(err);
            }
        });
    }

    // Publish a package.
    async publish({
        only_if_changed = false,
    }): Promise<{ has_changed: boolean; live_version: string }> {
        return new Promise<Awaited<ReturnType<typeof this.publish>>>(async (resolve, reject) => {

            // Check changes.
            if (only_if_changed && !(await this.has_commits())) {
                return resolve({ has_changed: false, live_version: this.config.version });
            }

            // Log in.
            try {
                await this.login();
            } catch (err) {
                return reject(err);
            }

            // Export version.
            if (this.version_path) { 
                const version_export = new Path(this.version_path);
                version_export.save_sync(`module.exports="${this.config.version}";`)
            }

            // Link when attribute "bin" is defined in the config.
            if (this.config.bin !== undefined) {
                const proc = new Proc();
                await proc.start({
                    command: "npm",
                    args: ["link"],
                    working_directory: this.source.str(),
                    interactive: false,
                })
                if (proc.exit_status !== 0) {
                    if (proc.err) {
                        console.log(proc.err);
                    }
                    return reject(proc.err);
                }
            }

            // Cache version.
            const old_version = this.config.version;

            // Increment version.
            await this.increment_version();

            // Replace the {{VERSION}} tag in the README.md.
            const readme = this.source.join(`/README.md`);
            let readme_data;
            if (readme.exists()) {
                readme_data = await readme.load();
                await readme.save(readme_data.replace(/version-.s*-blue/, `badge/version-${this.config.version}-blue`));
            }

            // Publish.
            const proc = new Proc();
            await proc.start({
                command: "npm",
                args: ["publish"],
                working_directory: this.source.str(),
                interactive: false,
            })
            if (proc.exit_status !== 0) {
                
                // Restore version.
                this.config.version = old_version;
                this.save();

                // Restore readme.
                if (readme_data !== undefined) {
                    await readme.save(readme_data);
                }

                // Log.
                if (proc.err) {
                    console.log(proc.err);
                }
                return reject(`Failed to publish pacakge ${this.config.name}.`);
            }
            resolve({ has_changed: true, live_version: this.config.version });
        })
    }

    // Checks whether the local package differs from the published version by comparing tarball SHA-1 checksums.
    async has_commits(
        log_level = -1,
        tmp_dir: string = '/tmp'
    ): Promise<boolean> {
        // Resolve the package directory and check for package.json
        const resolved_package_dir = this.source.abs();
        const pkg_path = resolved_package_dir.join('package.json');
        if (!pkg_path.exists()) {
            throw new Error(`Configuration file ${pkg_path.str()} does not exist.`);
        }

        // Read and parse package.json to get name and version
        const pkg_data = await pkg_path.load({encoding: 'utf-8'});
        let pkg: { name: string; version: string };
        try {
            pkg = JSON.parse(pkg_data);
        } catch (error) {
            throw new Error(`Error parsing ${pkg_path.str()}.`);
        }
        if (!pkg.name || !pkg.version) {
            throw new Error(`Configuration file ${pkg_path.str()} must contain both 'name' and 'version'.`);
        }

        // Generate a tarball in the tmp_dir using npm pack
        if (log_level > 0) {
            console.log(`Packing package "${pkg.name}" version "${pkg.version}" from ${resolved_package_dir.str()} into ${tmp_dir}...`);
        }
        let npm_pack_output: Buffer;
        try {
            npm_pack_output = execSync(`npm pack --silent ${resolved_package_dir.str()}`, { cwd: tmp_dir });
        } catch (error) {
            throw new Error("Error during npm pack execution");
        }
        const tarball_name = npm_pack_output.toString().trim().split('\n').pop()!;
        const tarball_path = new Path(tmp_dir + "/" + tarball_name);
        if (!tarball_path.exists()) {
            throw new Error(`Error: Tarball ${tarball_name} was not found at ${tarball_path.str()}`);
        }

        // Compute the SHA-1 checksum of the local tarball
        const tarball_buffer = await tarball_path.load({type: 'buffer'});
        const local_hash = crypto.createHash('sha1').update(tarball_buffer).digest('hex');
        if (log_level > 0) {
            console.log(`Local tarball SHA-1: ${local_hash}`);
        }

        // Retrieve the published tarball's shasum from the npm registry
        let published_hash: string;
        try {
            published_hash = execSync(`npm view ${pkg.name}@${pkg.version} dist.shasum`, { stdio: 'pipe' })
                .toString()
                .trim();
            if (log_level > 0) {
                console.log(`Published tarball SHA-1: ${published_hash}`);
            }
        } catch (error) {
            return true; // If the package is not published, we consider it as changed
            // throw new Error(`Version ${pkg.version} of package "${pkg.name}" is not published yet.`);
        }

        // Compare the checksums to determine if there are changes
        return local_hash !== published_hash;
    }
}
