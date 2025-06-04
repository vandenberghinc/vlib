
// Imports.
import * as vlib from "../dist/esm/index.js"
const { VRepo } = vlib;

// Get the directory name of the current module
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));

(async () => {
    const npm = new VRepo.NPM({
        source: __dirname + "/../",
    });
    console.log("vlib has npm commits:", await npm.has_commits());
})()
