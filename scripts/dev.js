#!/usr/bin/env node

const { spawn, spawnSync } = require('child_process');

// Start tsc in background:
spawn('tsc', ['--noEmit', '--watch'], {
  stdio: 'inherit',
});

// Start parcel:
spawnSync('parcel', ['src/index.html'], {
  stdio: 'inherit',
});
