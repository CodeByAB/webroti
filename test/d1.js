// @ts-check
/**
 * Minimal in-memory stand-in for Cloudflare D1, backed by Node's built-in
 * SQLite. Supports the subset lib/meetings.js uses: prepare/bind/first/run.
 * The schema comes from migrations/, so tests exercise the real SQL.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

const MIGRATIONS = new URL('../migrations/', import.meta.url);

/** @returns {import('../lib/meetings.js').D1Database & { sqlite: DatabaseSync }} */
export function createTestDb() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON'); // D1 enforces foreign keys by default
  for (const file of readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql'))
    .sort()) {
    sqlite.exec(readFileSync(new URL(file, MIGRATIONS), 'utf8'));
  }

  return {
    sqlite,
    prepare(sql) {
      /** @type {any[]} */
      let values = [];
      const statement = {
        /** @param {...any} args */
        bind(...args) {
          values = args;
          return statement;
        },
        async first() {
          const row = sqlite.prepare(sql).get(...values);
          return /** @type {any} */ (row ? { ...row } : null);
        },
        async run() {
          const { changes } = sqlite.prepare(sql).run(...values);
          return { meta: { changes: Number(changes) } };
        },
      };
      return statement;
    },
  };
}
