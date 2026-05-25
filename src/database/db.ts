import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

let dbInstance: sqlite3.Database | null = null;

function resolveDbPath() {
  const isTest = process.env.NODE_ENV === 'test';

  if (isTest) {
    return ':memory:';
  }
  
  // Docker / producción
  if (process.env.DB_PATH) {
    return process.env.DB_PATH;
  }

  return path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../data/wizard.db'
  );
}

export function getDb() {
  if (!dbInstance) {
    dbInstance = new sqlite3.Database(resolveDbPath());
  }
  return dbInstance;
}

export function closeDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!dbInstance) return resolve();

    dbInstance.close((err) => {
      dbInstance = null;
      if (err) reject(err);
      else resolve();
    });
  });
}

export const dbRun = (sql: string, params: any[] = []) =>
  new Promise<void>((resolve, reject) => {
    getDb().run(sql, params, (err) => (err ? reject(err) : resolve()));
  });

export const dbAll = (sql: string, params: any[] = []) =>
  new Promise<any[]>((resolve, reject) => {
    getDb().all(sql, params, (err, rows) =>
      err ? reject(err) : resolve(rows)
    );
  });

export async function initDatabase(): Promise<void> {
  await dbRun(`CREATE TABLE IF NOT EXISTS ingredients (name TEXT PRIMARY KEY)`);

  await dbRun(
    `CREATE TABLE IF NOT EXISTS elixirs (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      effect TEXT
    )`
  );

  await dbRun(`
    CREATE TABLE IF NOT EXISTS elixir_ingredients (
      elixir_id TEXT,
      ingredient_name TEXT,
      PRIMARY KEY (elixir_id, ingredient_name),
      FOREIGN KEY (elixir_id) REFERENCES elixirs(id) ON DELETE CASCADE,
      FOREIGN KEY (ingredient_name) REFERENCES ingredients(name) ON DELETE CASCADE
    )
  `);
}
