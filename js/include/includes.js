/*
 * Author: Daan van den Bergh
 * Copyright: © 2022 - 2023 Daan van den Bergh.
 */

// ---------------------------------------------------------
// Libraries.

const libfs = require('fs');
const libfsextra = require('fs-extra');
const libos = require('os');
const libpath = require('path');
const libproc = require("child_process");

// Initialize library.
const vlib = {};