import { describe, it, expect, jest, beforeEach } from '@jest/globals';

const mockGetBrewable = jest.fn();

jest.unstable_mockModule('../cache/elixirCache.js', () => ({
  globalCache: {
    getBrewable: mockGetBrewable
  },
  normalizeIngredient: (value: string) =>
    value.trim().toLowerCase()
}));

const { resolvers } = await import('../graphql/resolvers.js');

describe('GraphQL resolvers', () => {
  beforeEach(() => {
    mockGetBrewable.mockReset();
  });

  it('returns brewable elixirs', () => {
    mockGetBrewable.mockReturnValue([
      {
        id: '1',
        name: 'Elixir A',
        effect: 'Effect A',
        ingredients: ['a']
      }
    ]);

    const result = resolvers.Query.canBrewElixirs(
      {},
      { ingredients: ['A'] }
    );

    expect(mockGetBrewable).toHaveBeenCalledWith(['a']);

    expect(result).toHaveLength(1);

    expect(result[0].name).toBe('Elixir A');
  });
});