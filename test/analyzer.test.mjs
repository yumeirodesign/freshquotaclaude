import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { parseHistory, filterRecent, buildDistribution } from '../src/analyzer.mjs';

describe('parseHistory', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'timeslot-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('parses JSONL entries', () => {
    const filePath = join(tempDir, 'history.jsonl');
    const lines = [
      JSON.stringify({ display: 'hello', timestamp: 1000000, sessionId: 'a' }),
      JSON.stringify({ display: 'world', timestamp: 2000000, sessionId: 'b' }),
    ];
    writeFileSync(filePath, lines.join('\n') + '\n');

    const entries = parseHistory(filePath);
    assert.equal(entries.length, 2);
    assert.equal(entries[0].timestamp, 1000000);
    assert.equal(entries[1].display, 'world');
  });

  it('returns empty array for nonexistent file', () => {
    const entries = parseHistory(join(tempDir, 'nope.jsonl'));
    assert.deepEqual(entries, []);
  });

  it('skips malformed lines', () => {
    const filePath = join(tempDir, 'history.jsonl');
    writeFileSync(filePath, '{"timestamp":1000}\nBAD LINE\n{"timestamp":2000}\n');

    const entries = parseHistory(filePath);
    assert.equal(entries.length, 2);
  });
});

describe('filterRecent', () => {
  it('keeps entries within the last N days', () => {
    const now = Date.now();
    const entries = [
      { timestamp: now - 2 * 86400000 },  // 2 days ago
      { timestamp: now - 10 * 86400000 }, // 10 days ago
      { timestamp: now - 20 * 86400000 }, // 20 days ago
    ];
    const recent = filterRecent(entries, 14);
    assert.equal(recent.length, 2);
  });

  it('returns empty for no recent entries', () => {
    const entries = [{ timestamp: 0 }]; // epoch
    const recent = filterRecent(entries, 14);
    assert.equal(recent.length, 0);
  });
});

describe('buildDistribution', () => {
  it('buckets entries by local hour', () => {
    // Create entries at known hours in local timezone
    const makeEntry = (hour) => {
      const d = new Date();
      d.setHours(hour, 30, 0, 0);
      return { timestamp: d.getTime() };
    };

    const entries = [
      makeEntry(9), makeEntry(9), makeEntry(9),
      makeEntry(10), makeEntry(10),
      makeEntry(14),
    ];

    const dist = buildDistribution(entries);
    assert.equal(dist[9], 3);
    assert.equal(dist[10], 2);
    assert.equal(dist[14], 1);
    assert.equal(dist[0], 0);
    assert.equal(dist.length, 24);
  });

  it('returns all zeros for empty input', () => {
    const dist = buildDistribution([]);
    assert.equal(dist.length, 24);
    assert.equal(dist.reduce((a, b) => a + b, 0), 0);
  });
});
