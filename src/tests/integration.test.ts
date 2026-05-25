import { jest } from '@jest/globals';

beforeAll(() => {
  jest.resetModules();
});

let db: any;
let bootstrap: any;
let cacheModule: any;

beforeEach(async () => {
  db = await import('../database/db.js');
  bootstrap = await import('../services/bootstrap.js');
  cacheModule = await import('../cache/elixirCache.js');

  await db.initDatabase();
  await db.dbRun('DELETE FROM elixir_ingredients');
  await db.dbRun('DELETE FROM elixirs');
  await db.dbRun('DELETE FROM ingredients');
});

describe('Integration: full system flow', () => {
  it('should bootstrap, persist and allow cache queries', async () => {
    await bootstrap.runBootstrap();
    const cache = new cacheModule.ElixirCache();
    await cache.hydrate();

    const result = cache.getBrewable(['fluxweed', 'knotgrass']);
    expect(Array.isArray(result)).toBe(true);
  });
});