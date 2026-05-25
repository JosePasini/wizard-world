import { globalCache, normalizeIngredient } from '../cache/elixirCache.js';

export const resolvers = {
  Query: {
    canBrewElixirs: (_parent: unknown, args: { ingredients?: string[] }) => {
      const raw = Array.isArray(args.ingredients) ? args.ingredients : [];

      const sanitizedInventory = raw
        .filter((item): item is string => typeof item === 'string')
        .map(normalizeIngredient);

      return globalCache.getBrewable(sanitizedInventory);
    },
  },
};