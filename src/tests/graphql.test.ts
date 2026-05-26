import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockGetBrewable = jest.fn();

jest.unstable_mockModule('../cache/elixirCache.js', () => ({
  globalCache: {
    getBrewable: mockGetBrewable,
  },
  normalizeIngredient: (value: string) =>
    value.trim().toLowerCase(),
}));

const { resolvers } = await import('../graphql/resolvers.js');

describe('GraphQL resolvers', () => {
  beforeEach(() => {
    mockGetBrewable.mockReset();
  });

  it('returns brewable elixirs with Ingredient objects', () => {
    mockGetBrewable.mockReturnValue([
      {
        id: '1',
        name: 'Elixir A',
        effect: 'Effect A',
        ingredients: ['a', 'b'],
      },
    ]);

    const result = resolvers.Query.canBrewElixirs({}, { ingredients: ['A', 'B'] });

    expect(mockGetBrewable).toHaveBeenCalledWith(['a', 'b']);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Elixir A');

    const mapped = resolvers.Elixir.ingredients(result[0]);
    expect(mapped).toEqual([{ name: 'a' }, { name: 'b' }]);
  });

  it('sanitizes non-string inventory entries', () => {
    mockGetBrewable.mockReturnValue([]);

    resolvers.Query.canBrewElixirs(
      {},
      { ingredients: ['Valid', null as unknown as string, 42 as unknown as string] }
    );

    expect(mockGetBrewable).toHaveBeenCalledWith(['valid']);
  });
});
