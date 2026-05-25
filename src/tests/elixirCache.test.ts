import { describe, it, expect, beforeEach } from '@jest/globals';
import { initDatabase, dbRun } from '../database/db.js';
import { ElixirCache } from '../cache/elixirCache.js';

describe('Elixir Cache & Crafting Logic', () => {
  let cache: ElixirCache;

  beforeEach(async () => {
    await initDatabase();
    await dbRun('DELETE FROM elixir_ingredients');
    await dbRun('DELETE FROM elixirs');
    await dbRun('DELETE FROM ingredients');
    cache = new ElixirCache();
  });

  it('should successfully hydrate memory structures and filter brewable recipes', async () => {
    await dbRun('INSERT INTO elixirs (id, name, effect) VALUES (?, ?, ?)', ['1', 'Polyjuice Potion', 'Transformation']);
    await dbRun('INSERT INTO ingredients (name) VALUES (?)', ['fluxweed']);
    await dbRun('INSERT INTO elixir_ingredients (elixir_id, ingredient_name) VALUES (?, ?)', ['1', 'fluxweed']);

    await cache.hydrate();
    const results = cache.getBrewable(['fluxweed']);
    
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Polyjuice Potion');
  });

  it('should reject recipes if critical required ingredients are missing', async () => {
    const results = cache.getBrewable(['fluxweed']);
    expect(results.length).toBe(0);
  });

  it('should gracefully ignore recipes that have zero ingredients mapped', async () => {
    await dbRun('INSERT INTO elixirs (id, name, effect) VALUES (?, ?, ?)', ['2', 'Empty Potion', 'None']);
    await cache.hydrate();
    const results = cache.getBrewable([]);
    expect(results.length).toBe(0);
  });

  it('should deduplicate ingredient requirements in memory', async () => {
    await dbRun('INSERT INTO elixirs (id, name, effect) VALUES (?, ?, ?)', ['3', 'Healing Elixir', 'Heals']);
    await dbRun('INSERT INTO ingredients (name) VALUES (?)', ['dittany']);
    await dbRun('INSERT INTO elixir_ingredients (elixir_id, ingredient_name) VALUES (?, ?)', ['3', 'dittany']);

    await cache.hydrate();
    const results = cache.getBrewable(['dittany']);
    
    expect(results.length).toBe(1);
    expect(results[0].ingredients.length).toBe(1);
  });

  it('should perform case-insensitive matching', async () => {
    await dbRun('INSERT INTO elixirs (id, name, effect) VALUES (?, ?, ?)', ['4', 'Invisibility Potion', 'Invisibility']);
    await dbRun('INSERT INTO ingredients (name) VALUES (?)', ['cherub herbs']);
    await dbRun('INSERT INTO elixir_ingredients (elixir_id, ingredient_name) VALUES (?, ?)', ['4', 'cherub herbs']);

    await cache.hydrate();
    const results = cache.getBrewable(['   cHeRuB hErBs   ']);
    
    expect(results.length).toBe(1);
    expect(results[0].name).toBe('Invisibility Potion');
  });

  it('should be immune to poisonous inventory inputs', async () => {
    const results = cache.getBrewable([null, undefined, '', { o: true }, 123] as any);
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBe(0);
  });
});