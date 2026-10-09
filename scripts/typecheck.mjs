#!/usr/bin/env node
import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
const root = path.resolve(new URL('..', import.meta.url).pathname);
const dirs = ['src', 'api', 'scripts'];
let failed = false;
for (const dir of dirs) {
  for (const file of await readdir(path.join(root, dir))) {
    if (!file.endsWith('.js') && !file.endsWith('.mjs')) continue;
    const full = path.join(root, dir, file);
    const result = spawnSync(process.execPath, ['--check', full], { encoding: 'utf8' });
    if (result.status !== 0) { failed = true; process.stderr.write(result.stderr); }
  }
}
// Root browser entrypoint must be checked as well; production previously failed here.
const browserEntrypoint = spawnSync(process.execPath, ['--check', path.join(root, 'app.js')], { encoding: 'utf8' });
if (browserEntrypoint.status !== 0) { failed = true; process.stderr.write(browserEntrypoint.stderr); }
if (failed) process.exitCode = 1; else console.log('PASS: JavaScript syntax/type boundary checks passed');
