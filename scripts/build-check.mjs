#!/usr/bin/env node
import { access } from 'node:fs/promises';
for (const file of ['index.html', 'landing.css', 'landing.js', 'desk.html', 'desk-v3.css', 'desk-edition.css', 'desk-tour.css', 'desk-tour.js', 'desk-polish.css', 'styles.css', 'app.js', 'api/events.js', 'api/research.js', 'api/ai.js', 'vercel.json']) await access(file);
console.log('PASS: static entrypoint, API handlers, and Vercel manifest are present');
