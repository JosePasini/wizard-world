import { dbAll } from '../database/db.js';

export function normalizeIngredient(value: string): string {
  return value
    ? value
        .normalize('NFKC')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, ' ')
    : '';
}

interface CachedElixir {
  id: string;
  name: string;
  effect: string | null;
  ingredients: string[];
}

export class ElixirCache {
  private elixirCache = new Map<string, CachedElixir>();

  clear(): void {
    this.elixirCache.clear();
  }

  async hydrate(): Promise<void> {
    this.clear();

    const rows = (await dbAll(`
      SELECT 
        e.id AS elixir_id, 
        e.name AS elixir_name, 
        e.effect AS elixir_effect, 
        ei.ingredient_name 
      FROM elixirs e
      LEFT JOIN elixir_ingredients ei ON e.id = ei.elixir_id
    `)) as {
      elixir_id: string;
      elixir_name: string;
      elixir_effect: string | null;
      ingredient_name: string | null;
    }[];

    const seen = new Set<string>();

    for (const row of rows) {
      if (!row.elixir_id) continue;

      if (!this.elixirCache.has(row.elixir_id)) {
        this.elixirCache.set(row.elixir_id, {
          id: row.elixir_id,
          name: row.elixir_name,
          effect: row.elixir_effect,
          ingredients: []
        });
      }

      if (!row.ingredient_name) continue;

      const normalized = normalizeIngredient(row.ingredient_name);
      const key = `${row.elixir_id}-${normalized}`;

      if (seen.has(key)) continue;

      const elixir = this.elixirCache.get(row.elixir_id);
      if (elixir) {
        elixir.ingredients.push(normalized);
      }

      seen.add(key);
    }
  }

  getBrewable(userInventory: string[]): CachedElixir[] {
    const inventorySet = new Set(
      (userInventory || [])
        .filter((x): x is string => typeof x === 'string')
        .map(normalizeIngredient)
    );

    return Array.from(this.elixirCache.values()).filter(elixir => {
      if (elixir.ingredients.length === 0) return false;
      return elixir.ingredients.every(ing => inventorySet.has(ing));
    });
  }
}

export const globalCache = new ElixirCache();