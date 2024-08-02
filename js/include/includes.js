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
const libhttp = require('http');
const libhttps = require('https');
const libhttp2 = require('http2');
const libbson = require('bson');
const zlib = require('zlib');
const sysinfo = require('systeminformation');
const readlinelib = require('readline');
const diskusagelib = require('diskusage');
const libcluster = require('cluster');
const libcrypto = require("crypto");

// Initialize library.
const vlib = {};
vlib.internal = {};