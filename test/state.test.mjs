import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { readState, writeState } from '../src/state.mjs';

describe('state', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'timeslot-test-'));
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('returns default state when file does not exist', () => {
    const state = readState(join(tempDir, 'nonexistent.json'));
    assert.equal(state.anchor, null);
    assert.equal(state.lastTrigger, null);
    assert.equal(state.lastError, null);
  });

  it('writes and reads state', () => {
    const filePath = join(tempDir, 'state.json');
    const data = { anchor: '08:00', lastTrigger: '2026-04-05T08:00:00+08:00' };
    writeState(filePath, data);

    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    assert.equal(parsed.anchor, '08:00');

    const state = readState(filePath);
    assert.equal(state.anchor, '08:00');
    assert.equal(state.lastTrigger, '2026-04-05T08:00:00+08:00');
    assert.equal(state.lastError, null);
  });

  it('merges with defaults on partial state', () => {
    const filePath = join(tempDir, 'state.json');
    writeState(filePath, { anchor: '09:00' });

    const state = readState(filePath);
    assert.equal(state.anchor, '09:00');
    assert.equal(state.distribution, null);
    assert.equal(state.lastResult, null);
  });
});
