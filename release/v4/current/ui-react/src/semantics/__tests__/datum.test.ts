import { describe, it, expect } from 'vitest';
import { createDatum, validateDatumInput, isSemanticDatum } from '../datum';
import type { CreateDatumInput } from '../datum';

describe('createDatum', () => {
  const validInput: CreateDatumInput = {
    id: 'test-1',
    label: 'Test',
    value: 42,
    dataKind: 'quantitative',
    task: 'identify',
    role: 'primary',
  };

  it('creates a datum from valid input', () => {
    const d = createDatum(validInput);
    expect(d.id).toBe('test-1');
    expect(d.value).toBe(42);
  });

  it('preserves optional fields', () => {
    const d = createDatum({
      ...validInput,
      unit: '%',
      domain: [0, 100],
      target: 75,
      thresholds: [{ value: 60, meaning: 'ok', severity: 'positive' }],
      uncertainty: { lower: 0.7, upper: 0.9, method: 'bootstrap' },
      provenance: { source: 'test', timestamp: '2026-06-29' },
    });
    expect(d.unit).toBe('%');
    expect(d.domain).toEqual([0, 100]);
    expect(d.target).toBe(75);
    expect(d.thresholds).toHaveLength(1);
    expect(d.uncertainty?.method).toBe('bootstrap');
    expect(d.provenance?.source).toBe('test');
  });

  it('throws on invalid dataKind', () => {
    expect(() =>
      createDatum({ ...validInput, dataKind: 'invalid' as never }),
    ).toThrow();
  });

  it('throws on invalid task', () => {
    expect(() =>
      createDatum({ ...validInput, task: 'invalid' as never }),
    ).toThrow();
  });

  it('throws on invalid role', () => {
    expect(() =>
      createDatum({ ...validInput, role: 'invalid' as never }),
    ).toThrow();
  });

  it('throws on empty id', () => {
    expect(() => createDatum({ ...validInput, id: '' })).toThrow();
  });

  it('throws on empty label', () => {
    expect(() => createDatum({ ...validInput, label: '' })).toThrow();
  });

  it('throws on undefined value', () => {
    expect(() => createDatum({ ...validInput, value: undefined })).toThrow();
  });

  it('throws on invalid domain (min >= max)', () => {
    expect(() =>
      createDatum({ ...validInput, domain: [10, 10] }),
    ).toThrow();
  });

  it('throws on invalid domain (wrong length)', () => {
    expect(() =>
      createDatum({ ...validInput, domain: [0] as unknown as [number, number] }),
    ).toThrow();
  });
});

describe('validateDatumInput', () => {
  it('returns empty array for valid input', () => {
    const errors = validateDatumInput({
      id: 'x',
      label: 'X',
      value: 1,
      dataKind: 'quantitative',
      task: 'compare',
      role: 'primary',
    });
    expect(errors).toEqual([]);
  });

  it('collects multiple errors', () => {
    const errors = validateDatumInput({
      id: '',
      label: '',
      value: undefined,
      dataKind: 'bad' as never,
      task: 'bad' as never,
      role: 'bad' as never,
    });
    expect(errors.length).toBeGreaterThanOrEqual(5);
  });
});

describe('isSemanticDatum', () => {
  it('returns true for a valid datum', () => {
    const d = createDatum({
      id: 'x',
      label: 'X',
      value: 1,
      dataKind: 'quantitative',
      task: 'compare',
      role: 'primary',
    });
    expect(isSemanticDatum(d)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isSemanticDatum(null)).toBe(false);
  });

  it('returns false for plain object without required fields', () => {
    expect(isSemanticDatum({ foo: 'bar' })).toBe(false);
  });

  it('returns false for object with invalid task', () => {
    expect(
      isSemanticDatum({
        id: 'x',
        label: 'X',
        value: 1,
        dataKind: 'quantitative',
        task: 'badtask',
        role: 'primary',
      }),
    ).toBe(false);
  });
});