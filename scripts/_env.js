'use strict';

/**
 * Minimal environment helper for maintenance scripts.
 *
 * Never commit real credentials. Create a local `.env` (already ignored by git)
 * and run scripts with:
 *
 *   node --env-file=.env scripts/<script>.js
 */

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`[config] Missing required environment variable: ${name}`);
    console.error('Set it in your shell or run with: node --env-file=.env scripts/<script>.js');
    process.exit(1);
  }
  return value;
}

function requireFlag(name, message) {
  if (process.env[name] !== '1') {
    console.error(`[safety] ${message}`);
    console.error(`[safety] Set ${name}=1 only after a backup and a staging review.`);
    process.exit(1);
  }
}

module.exports = { requireEnv, requireFlag };
