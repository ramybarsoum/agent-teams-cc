#!/usr/bin/env node
// Agent Teams update checker - runs on session start
// Compares installed version vs npm registry, caches result
// Called by SessionStart hook. Lightweight, no dependencies.

const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');

const homeDir = os.homedir();
const cacheDir = path.join(homeDir, '.claude', 'cache');
const cacheFile = path.join(cacheDir, 'team-update-check.json');

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Read installed version from package.json (walk up from this file)
let installed = '0.0.0';
try {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(pkgPath)) {
    installed = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version || '0.0.0';
  }
} catch (e) {}

// Fetch latest version from npm registry (no dependencies, raw https)
const req = https.get('https://registry.npmjs.org/agent-teams-cc/latest', { timeout: 8000 }, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    let latest = 'unknown';
    try { latest = JSON.parse(body).version || 'unknown'; } catch (e) {}

    const result = {
      update_available: latest !== 'unknown' && installed !== latest,
      installed,
      latest,
      checked: Math.floor(Date.now() / 1000)
    };

    fs.writeFileSync(cacheFile, JSON.stringify(result));
  });
});

req.on('error', () => {}); // Silent fail on network errors
req.on('timeout', () => req.destroy());
