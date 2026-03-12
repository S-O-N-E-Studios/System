import { describe, it, expect, vi } from 'vitest';

vi.mock('@/api/activities', () => ({
  activitiesApi: {
    listByProject: vi.fn(),
  },
}));

import { useActivities } from './useActivities';

describe('useActivities hook', () => {
  it('exports the hook', () => {
    expect(typeof useActivities).toBe('function');
  });
});
