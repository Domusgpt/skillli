import { describe, it, expect } from 'vitest';
import { deduplicateResults, rankResults } from '../../src/trawler/ranker.js';
import type { TrawlResult } from '../../src/core/types.js';

const makeResult = (
  name: string,
  source: TrawlResult['source'],
  confidence: number,
  tags?: string[],
): TrawlResult => ({
  source,
  skill: { name, description: `A ${name} skill`, tags },
  confidence,
  url: `https://example.com/${name}`,
});

describe('deduplicateResults', () => {
  it('keeps unique results', () => {
    const results = [
      makeResult('skill-a', 'registry', 0.9),
      makeResult('skill-b', 'github', 0.7),
    ];
    const deduped = deduplicateResults(results);
    expect(deduped).toHaveLength(2);
  });

  it('removes duplicates by name, keeping higher confidence', () => {
    const results = [
      makeResult('skill-a', 'registry', 0.5),
      makeResult('skill-a', 'github', 0.9),
    ];
    const deduped = deduplicateResults(results);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].confidence).toBe(0.9);
    expect(deduped[0].source).toBe('github');
  });

  it('handles results without names', () => {
    const result: TrawlResult = {
      source: 'npm',
      skill: { description: 'No name' },
      confidence: 0.5,
      url: 'https://example.com/no-name',
    };
    const deduped = deduplicateResults([result]);
    expect(deduped).toHaveLength(1);
  });
});

describe('rankResults', () => {
  it('ranks registry results higher', () => {
    const results = [
      makeResult('skill-a', 'github', 0.5),
      makeResult('skill-b', 'registry', 0.5),
    ];
    const ranked = rankResults(results, 'skill');
    // Registry gets +0.2 bonus, github gets +0.05
    expect(ranked[0].skill.name).toBe('skill-b');
  });

  it('boosts results matching query in name', () => {
    const results = [
      makeResult('unrelated', 'registry', 0.5),
      makeResult('code-review', 'registry', 0.5),
    ];
    const ranked = rankResults(results, 'code review');
    // code-review matches both "code" and "review" in name
    expect(ranked[0].skill.name).toBe('code-review');
  });

  it('boosts results matching query in tags', () => {
    const results = [
      makeResult('skill-a', 'registry', 0.5, ['unrelated']),
      makeResult('skill-b', 'registry', 0.5, ['typescript', 'testing']),
    ];
    const ranked = rankResults(results, 'typescript');
    expect(ranked[0].skill.name).toBe('skill-b');
  });

  it('handles results with no tags', () => {
    const results = [
      makeResult('skill-a', 'registry', 0.5),
      makeResult('skill-b', 'registry', 0.5, undefined),
    ];
    // Should not crash
    const ranked = rankResults(results, 'test');
    expect(ranked).toHaveLength(2);
  });

  it('caps confidence at 1.0', () => {
    const results = [
      makeResult('test-skill', 'registry', 0.95, ['test', 'skill']),
    ];
    const ranked = rankResults(results, 'test skill');
    expect(ranked[0].confidence).toBeLessThanOrEqual(1);
  });
});
