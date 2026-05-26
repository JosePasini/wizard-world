import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

const mockDbRun = jest.fn(
  (_sql: string, _params?: unknown[]) => Promise.resolve()
);
const mockDbAll = jest.fn((_sql: string, _params?: unknown[]) =>
  Promise.resolve([{ count: 0 }])
);

jest.unstable_mockModule('../database/db.js', () => ({
  dbRun: mockDbRun,
  dbAll: mockDbAll,
}));

jest.unstable_mockModule('../utils/retry.js', () => ({
  retryWithBackoff: (fn: () => Promise<unknown>) => fn(),
}));

const { runBootstrap } = await import('../services/bootstrap.js');

const sampleApiElixirs = [
  {
    id: 'elixir-1',
    name: 'Test Potion',
    effect: 'Testing',
    ingredients: [{ name: 'Fluxweed' }, { name: 'Knotgrass' }],
  },
];

describe('bootstrap', () => {
  let fetchSpy: ReturnType<typeof jest.spyOn>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbRun.mockImplementation(() => Promise.resolve());
    mockDbAll.mockImplementation(() => Promise.resolve([{ count: 0 }]));

    fetchSpy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => sampleApiElixirs,
    } as Response);
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  it('fetches and persists elixirs, ingredients, and relations when DB is empty', async () => {
    await runBootstrap();

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      'https://wizard-world-api.herokuapp.com/Elixirs'
    );

    expect(mockDbRun).toHaveBeenCalledWith('BEGIN TRANSACTION');
    expect(mockDbRun).toHaveBeenCalledWith('COMMIT');

    expect(mockDbRun).toHaveBeenCalledWith(
      'INSERT OR IGNORE INTO elixirs (id, name, effect) VALUES (?, ?, ?)',
      ['elixir-1', 'Test Potion', 'Testing']
    );

    expect(mockDbRun).toHaveBeenCalledWith(
      'INSERT OR IGNORE INTO ingredients (name) VALUES (?)',
      ['fluxweed']
    );
    expect(mockDbRun).toHaveBeenCalledWith(
      'INSERT OR IGNORE INTO ingredients (name) VALUES (?)',
      ['knotgrass']
    );

    expect(mockDbRun).toHaveBeenCalledWith(
      'INSERT OR IGNORE INTO elixir_ingredients (elixir_id, ingredient_name) VALUES (?, ?)',
      ['elixir-1', 'fluxweed']
    );
    expect(mockDbRun).toHaveBeenCalledWith(
      'INSERT OR IGNORE INTO elixir_ingredients (elixir_id, ingredient_name) VALUES (?, ?)',
      ['elixir-1', 'knotgrass']
    );
  });

  it('skips external API when database already has elixirs', async () => {
    mockDbAll.mockImplementation(() => Promise.resolve([{ count: 3 }]));

    await runBootstrap();

    expect(fetchSpy).not.toHaveBeenCalled();
    expect(mockDbRun).not.toHaveBeenCalledWith('BEGIN TRANSACTION');
  });
});
