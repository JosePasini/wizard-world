import { dbAll, dbRun } from '../database/db.js';
import { retryWithBackoff } from '../utils/retry.js';
import { normalizeIngredient } from '../cache/elixirCache.js';

async function isDatabasePopulated(): Promise<boolean> {
  const result = await dbAll('SELECT COUNT(*) as count FROM elixirs');
  const row = result[0] as { count: number } | undefined;
  return (row?.count ?? 0) > 0;
}

export async function runBootstrap(): Promise<void> {
  console.log('BOOTSTRAP: Starting synchronization process...');

  try {
    const isPopulated = await isDatabasePopulated();
    if (isPopulated) {
      console.log('BOOTSTRAP: Data already exists. Skipping synchronization.');
      return;
    }

    const externalElixirs = await retryWithBackoff(async () => {
      console.log('API: Requesting elixirs from external source...');
      const response = await fetch('https://wizard-world-api.herokuapp.com/Elixirs');

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();

      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('Invalid API response');
      }

      return data;
    }, {
      maxRetries: 5,
      initialDelayMs: 1000,
      backoffFactor: 2
    });

    console.log(`BOOTSTRAP: Received ${externalElixirs.length} elixirs.`);

    await dbRun('BEGIN TRANSACTION');

    for (const elixir of externalElixirs) {
      await dbRun(
        'INSERT OR IGNORE INTO elixirs (id, name, effect) VALUES (?, ?, ?)',
        [elixir.id, elixir.name, elixir.effect || null]
      );

      if (!Array.isArray(elixir.ingredients)) continue;

      for (const ing of elixir.ingredients) {
        if (!ing?.name) continue;

        const cleanIngredientName = normalizeIngredient(ing.name);
        if (!cleanIngredientName) continue;

        await dbRun(
          'INSERT OR IGNORE INTO ingredients (name) VALUES (?)',
          [cleanIngredientName]
        );

        await dbRun(
          'INSERT OR IGNORE INTO elixir_ingredients (elixir_id, ingredient_name) VALUES (?, ?)',
          [elixir.id, cleanIngredientName]
        );
      }
    }

    await dbRun('COMMIT');
    console.log('BOOTSTRAP: Database successfully populated.');

  } catch (error) {
    try {
      await dbRun('ROLLBACK');
    } catch (_) {}

    console.error('BOOTSTRAP ERROR:', error);
    throw error;
  }
}