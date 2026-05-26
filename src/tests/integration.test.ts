import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

let db: typeof import('../database/db.js');
let bootstrap: typeof import('../services/bootstrap.js');
let cacheModule: typeof import('../cache/elixirCache.js');

const mockApiElixirs = [
  {
    id: 'int-1',
    name: 'Polyjuice Potion',
    effect: 'Transformation',
    ingredients: [{ name: 'Fluxweed' }, { name: 'Knotgrass' }],
  },
  {
    id: 'int-2',
    name: 'Simple Draught',
    effect: null,
    ingredients: [{ name: 'Dittany' }],
  },
];

describe('Integration: full system flow', () => {
  let fetchSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(async () => {
    jest.resetModules();

    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockApiElixirs,
    } as Response);

    db = await import('../database/db.js');
    bootstrap = await import('../services/bootstrap.js');
    cacheModule = await import('../cache/elixirCache.js');

    await db.initDatabase();
    await db.dbRun('DELETE FROM elixir_ingredients');
    await db.dbRun('DELETE FROM elixirs');
    await db.dbRun('DELETE FROM ingredients');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('bootstraps, persists ingredients, hydrates cache, and filters brewable elixirs', async () => {
    await bootstrap.runBootstrap();

    const ingredientRows = await db.dbAll('SELECT name FROM ingredients ORDER BY name');
    expect(ingredientRows.map((r: { name: string }) => r.name)).toEqual([
      'dittany',
      'fluxweed',
      'knotgrass',
    ]);

    const cache = new cacheModule.ElixirCache();
    await cache.hydrate();

    const brewable = cache.getBrewable(['fluxweed', 'knotgrass']);
    expect(brewable).toHaveLength(1);
    expect(brewable[0].name).toBe('Polyjuice Potion');
    expect(brewable[0].ingredients).toEqual(['fluxweed', 'knotgrass']);

    const partial = cache.getBrewable(['fluxweed']);
    expect(partial).toHaveLength(0);
  });

  it('does not call external API on second bootstrap when DB is populated', async () => {
    await bootstrap.runBootstrap();
    fetchSpy.mockClear();

    await bootstrap.runBootstrap();

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
