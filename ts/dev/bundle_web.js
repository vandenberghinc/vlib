#!/usr/bin / env node
/**
 * Bundle vlib web, this is mainly so we can detect if a node file is used inside the web module.
 */

import * as vlib from "../dist/esm/vlib/index.js"
import * as vts from "../dist/esm/vts/index.js"

// Bundle vlib web.
const response = await vts.bundle({
    include: [`${import.meta.dirname}/../dist/web/vlib/index.web.js`],
    output: "/tmp/vlib.web.js",
    platform: 'browser',
    format: "esm",
    minify: false,
    // tree_shaking: true,
})
if (response.errors.length > 0) {
    console.log(response.debug());
    vlib.log.error(`Failed to bundle vlib web.`);
    process.exit(1);
}