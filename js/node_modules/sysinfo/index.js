'use strict';

var os = require('os');

var os_methods = [
  'hostname', 'type', 'platform', 'arch', 
  'release', 'uptime', 'loadavg', 'totalmem', 
  'freemem', 'cpus', 'networkInterfaces'
];

var process_methods = [
  'cwd', 'getgid', 'getuid', 'memoryUsage' 
];

var process_properties = [
  'env', 'version', 'versions', 'installPrefix', 'pid', 'title' 
];

var result = module.exports = { os: {}, process: {} };

os_methods.forEach(function (method) {
  result.os[method] = os[method]();
});

process_methods.forEach(function (method) {
  result.process[method] = process[method]();
});

process_properties.forEach(function (property) {
  result.process[property] = process[property];
});

var now = new Date();

result.timestamp = now.valueOf();
result.currentDate = now;
