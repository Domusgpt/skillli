import { describe, it, expect } from 'vitest';
import { join } from 'path';
import {
  checkLineCount,
  checkProhibitedPatterns,
  computeTrustScore,
} from '../../src/core/safeguards.js';
import { parseSkillFile } from '../../src/core/parser.js';

const FIXTURES = join(__dirname, '..', 'fixtures');

describe('checkLineCount', () => {
  it('passes for short content', () => {
    const result = checkLineCount('line1\nline2\nline3');
    expect(result.passed).toBe(true);
  });

  it('fails for content exceeding 500 lines', () => {
    const longContent = Array(501).fill('line').join('\n');
    const result = checkLineCount(longContent);
    expect(result.passed).toBe(false);
  });
});

describe('checkProhibitedPatterns', () => {
  it('passes clean content', () => {
    const result = checkProhibitedPatterns('This is safe content with no bad patterns.');
    expect(result.passed).toBe(true);
  });

  it('detects eval()', () => {
    const result = checkProhibitedPatterns('use eval("bad code") here');
    expect(result.passed).toBe(false);
    expect(result.message).toContain('eval()');
  });

  it('detects rm -rf /', () => {
    const result = checkProhibitedPatterns('run rm -rf /important');
    expect(result.passed).toBe(false);
  });

  it('detects hardcoded passwords', () => {
    const result = checkProhibitedPatterns('password: "supersecret123"');
    expect(result.passed).toBe(false);
  });
});

describe('computeTrustScore', () => {
  it('computes score for a valid skill', async () => {
    const skill = await parseSkillFile(join(FIXTURES, 'valid-skill', 'SKILL.md'));
    const score = computeTrustScore(skill);
    // Has license (+10), version (+5), author (+5), passes checks (+35) = 55
    expect(score).toBeGreaterThanOrEqual(35);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('computes lower score for a minimal skill', async () => {
    const skill = await parseSkillFile(join(FIXTURES, 'minimal-skill', 'SKILL.md'));
    const score = computeTrustScore(skill);
    // No license, no version, no author, no repo — only passes checks (+35)
    expect(score).toBeGreaterThanOrEqual(20);
    expect(score).toBeLessThanOrEqual(100);
    // Should be lower than valid-skill which has more fields
    const fullSkill = await parseSkillFile(join(FIXTURES, 'valid-skill', 'SKILL.md'));
    expect(score).toBeLessThan(computeTrustScore(fullSkill));
  });
});
