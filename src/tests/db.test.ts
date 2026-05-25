import { initDatabase, dbRun, dbAll } from '../database/db.js';

describe('Database layer', () => {
  beforeAll(async () => {
    await initDatabase();
  });

  it('should insert and retrieve elixirs', async () => {
    await dbRun(`
      INSERT INTO elixirs (id, name, effect)
      VALUES ('test-1', 'Test Elixir', 'Testing')
    `);

    const rows = await dbAll(`
      SELECT * FROM elixirs WHERE id = 'test-1'
    `);

    expect(rows.length).toBe(1);
    expect(rows[0].name).toBe('Test Elixir');
  });
});