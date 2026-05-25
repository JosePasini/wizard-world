import { describe, it, expect, jest, beforeEach } from '@jest/globals';

// reset entre tests para evitar leaks
beforeEach(() => {
  jest.resetModules();
});

// mocks FIRST
const mockDbRun = jest.fn(() => Promise.resolve());
const mockDbAll = jest.fn(() =>
  Promise.resolve([{ count: 0 }])
);

jest.unstable_mockModule('../database/db.js', () => ({
  dbRun: mockDbRun,
  dbAll: mockDbAll,
}));

jest.unstable_mockModule('../utils/retry.js', () => ({
  retryWithBackoff: (fn: any) => fn(),
}));

describe('bootstrap', () => {
  it('runs without crashing when DB is empty', async () => {
    const mockDbRun = jest.fn(() => Promise.resolve());
    const mockDbAll = jest.fn(() =>
      Promise.resolve([{ count: 0 }])
    );

    jest.unstable_mockModule('../database/db.js', () => ({
      dbRun: mockDbRun,
      dbAll: mockDbAll,
    }));

    jest.unstable_mockModule('../utils/retry.js', () => ({
      retryWithBackoff: (fn: any) => fn(),
    }));

    const { runBootstrap } = await import('../services/bootstrap.js');

    await expect(runBootstrap()).resolves.not.toThrow();
    expect(mockDbAll).toHaveBeenCalled();
  });
});