import { describe, expect, it } from 'vitest';
import { dateLabel, newWorld } from '../src/sim/world';
import { GLOSSARY } from '../src/content/glossary';

describe('the world', () => {
  it('starts on 1 January 1936', () => {
    expect(dateLabel(newWorld('story', 'test'))).toBe('1 January 1936');
  });
  it('counts days across months and leap years', () => {
    const w = newWorld('story', 'test');
    expect(dateLabel({ ...w, day: 66 })).toBe('7 March 1936'); // 1936 was a leap year
    expect(dateLabel({ ...w, day: 366 })).toBe('1 January 1937');
  });
  it('is the same for the same seed text', () => {
    expect(newWorld('freeForAll', 'abc')).toEqual(newWorld('freeForAll', 'abc'));
  });
  it('survives being saved as JSON', () => {
    const w = newWorld('story', 'save-me');
    expect(JSON.parse(JSON.stringify(w))).toEqual(w);
  });
});

describe('the codex', () => {
  it('has no duplicate ids', () => {
    expect(new Set(GLOSSARY.map((t) => t.id)).size).toBe(GLOSSARY.length);
  });
});
