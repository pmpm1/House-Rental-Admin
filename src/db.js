import { readFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DB_PATH = process.env.DB_PATH || resolve('data/house-rental.sqlite');

export function openDatabase(path = DB_PATH) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path);
  db.exec('PRAGMA foreign_keys = ON');
  return db;
}

export function initializeDatabase(db) {
  const schema = readFileSync(resolve('schema.sql'), 'utf8');
  db.exec(schema);
}

function applyParams(statement, method, params) {
  if (Array.isArray(params)) return statement[method](...params);
  return statement[method](params);
}

export function getRows(db, sql, params = {}) {
  return applyParams(db.prepare(sql), 'all', params);
}

export function getRow(db, sql, params = {}) {
  return applyParams(db.prepare(sql), 'get', params);
}

export function run(db, sql, params = {}) {
  return applyParams(db.prepare(sql), 'run', params);
}

export function buildSearch(search, columns) {
  if (!search) return { clause: '', params: {} };
  const params = { search: `%${search.toLowerCase()}%` };
  const clause = ` AND (${columns.map((column) => `LOWER(${column}) LIKE $search`).join(' OR ')})`;
  return { clause, params };
}
