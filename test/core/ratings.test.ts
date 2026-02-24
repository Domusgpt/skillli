import { describe, it, expect } from 'vitest';
import { formatRating } from '../../src/core/ratings.js';
import type { RatingInfo } from '../../src/core/types.js';

describe('formatRating', () => {
  it('formats a rating with stars', () => {
    const rating: RatingInfo = {
      average: 4.5,
      count: 100,
      distribution: [2, 3, 10, 30, 55],
    };
    const result = formatRating(rating);
    expect(result).toContain('4.5');
    expect(result).toContain('100 ratings');
    // 4.5 rounds to 5 filled stars
    expect(result).toContain('\u2605\u2605\u2605\u2605\u2605');
  });

  it('formats a low rating', () => {
    const rating: RatingInfo = {
      average: 1.2,
      count: 5,
      distribution: [4, 1, 0, 0, 0],
    };
    const result = formatRating(rating);
    expect(result).toContain('1.2');
    expect(result).toContain('5 ratings');
    // 1.2 rounds to 1 filled star
    expect(result).toContain('\u2605\u2606\u2606\u2606\u2606');
  });

  it('formats zero ratings', () => {
    const rating: RatingInfo = {
      average: 0,
      count: 0,
      distribution: [0, 0, 0, 0, 0],
    };
    const result = formatRating(rating);
    expect(result).toContain('0.0');
    expect(result).toContain('0 ratings');
  });
});
