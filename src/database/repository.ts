import { dbRun, dbAll } from './db.js';

export interface DbElixir {
  id: string;
  name: string;
  effect: string | null;
}

export interface DbIngredient {
  name: string;
}

export interface DbElixirRelation {
  elixir_id: string;
  ingredient_name: string;
}

/**
 * Saves elixirs, ingredients, and their relationships into the database.
 * Uses a single transaction for atomicity.
 */
export async function saveBootstrapData(
  elixirs: DbElixir[],
  ingredients: DbIngredient[],
  relations: DbElixirRelation[]
): Promise<void> {
  console.log('--- DB REPOSITORY: Starting transaction ---');

  try {
    await dbRun('BEGIN TRANSACTION');

    // Ingredients (name is the identity)
    for (const ingredient of ingredients) {
      await dbRun(
        'INSERT OR IGNORE INTO ingredients (name) VALUES (?)',
        [ingredient.name]
      );
    }

    // Elixirs
    for (const elixir of elixirs) {
      await dbRun(
        'INSERT OR REPLACE INTO elixirs (id, name, effect) VALUES (?, ?, ?)',
        [elixir.id, elixir.name, elixir.effect]
      );
    }

    // Relations
    for (const rel of relations) {
      await dbRun(
        'INSERT OR IGNORE INTO elixir_ingredients (elixir_id, ingredient_name) VALUES (?, ?)',
        [rel.elixir_id, rel.ingredient_name]
      );
    }

    await dbRun('COMMIT');

    console.log('--- DB REPOSITORY: Transaction committed ---');
  } catch (error) {
    try {
      await dbRun('ROLLBACK');
    } catch (_) {
      // ignore rollback errors
    }

    console.error('--- DB REPOSITORY ERROR ---', error);
    throw error;
  }
}

/**
 * Checks if DB already has data.
 */
async function isDatabasePopulated(): Promise<boolean> {
  const result = await dbAll(`
    SELECT 
      (SELECT COUNT(*) FROM elixirs) as elixirs,
      (SELECT COUNT(*) FROM elixir_ingredients) as relations
  `);

  const row = result[0];

  return (
    Number(row?.elixirs ?? 0) > 0 &&
    Number(row?.relations ?? 0) > 0
  );
}

/**
 * Loads all elixirs with ingredients for cache hydration.
 */
export async function getAllElixirsWithIngredients(): Promise<any[]> {
  const query = `
    SELECT 
      e.id AS elixir_id,
      e.name AS elixir_name,
      e.effect AS elixir_effect,
      ei.ingredient_name AS ingredient_name
    FROM elixirs e
    LEFT JOIN elixir_ingredients ei ON e.id = ei.elixir_id
  `;

  return dbAll(query);
}
