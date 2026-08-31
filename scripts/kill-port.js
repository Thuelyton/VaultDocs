#!/usr/bin/env node
/**
 * Kill any process listening on a given TCP port.
 * Defaults to 3000 (the VaultDocs API port).
 *
 * Usage:
 *   node scripts/kill-port.js          # kills port 3000
 *   PORT=3001 node scripts/kill-port.js
 */

const { execSync } = require('child_process');
const port = process.env.PORT || '3000';

function isWindows() {
  return process.platform === 'win32';
}

function tryCrossPlatform() {
  // Try cross-platform package first
  try {
    execSync(`npx --yes kill-port ${port}`, { stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}

function killWindows(port) {
  try {
    const out = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    const pids = new Set();
    for (const line of out.split(/\r?\n/)) {
      const m = line.match(/\s(\d+)\s*$/);
      if (m) pids.add(m[1]);
    }
    if (pids.size === 0) {
      console.log(`ℹ️  No process listening on port ${port}`);
      return;
    }
    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, { stdio: 'inherit' });
      } catch {
        // ignore individual failures
      }
    }
  } catch {
    console.log(`ℹ️  No process listening on port ${port}`);
  }
}

function killUnix(port) {
  try {
    const out = execSync(`lsof -ti tcp:${port}`, { encoding: 'utf8' });
    const pids = out
      .split(/\r?\n/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (pids.length === 0) {
      console.log(`ℹ️  No process listening on port ${port}`);
      return;
    }
    for (const pid of pids) {
      try {
        execSync(`kill -9 ${pid}`, { stdio: 'inherit' });
      } catch {
        // ignore
      }
    }
  } catch {
    console.log(`ℹ️  No process listening on port ${port}`);
  }
}

if (!tryCrossPlatform()) {
  if (isWindows()) {
    killWindows(port);
  } else {
    killUnix(port);
  }
}
