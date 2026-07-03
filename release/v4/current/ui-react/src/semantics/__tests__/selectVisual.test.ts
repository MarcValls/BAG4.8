import { describe, it, expect } from 'vitest';
import { createDatum } from '../datum';
import { selectVisual, TASK_TO_VISUAL } from '../selectVisual';
import type { AnalyticTask, DataKind, DatumRole } from '../types';

const baseInput = {
  id: 'test',
  label: 'Test',
  value: 0.5,
  dataKind: 'quantitative' as DataKind,
  role: 'primary' as DatumRole,
};

describe('selectVisual — all 12 AnalyticTask', () => {
  const tasks: AnalyticTask[] = [
    'identify', 'compare', 'rank', 'trend', 'distribution',
    'composition', 'deviation', 'correlation', 'trace',
    'flow', 'hierarchy', 'inspect',
  ];

  it('covers all 12 tasks in TASK_TO_VISUAL', () => {
    expect(Object.keys(TASK_TO_VISUAL)).toHaveLength(12);
    for (const task of tasks) {
      expect(TASK_TO_VISUAL[task]).toBeDefined();
    }
  });

  it('returns stat for identify (single item)', () => {
    const d = createDatum({ ...baseInput, task: 'identify' });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('stat');
    expect(spec.directLabels).toBe(true);
  });

  it('returns table for identify (multi cardinality)', () => {
    const d = createDatum({ ...baseInput, task: 'identify' });
    const spec = selectVisual(d, { cardinality: 5 });
    expect(spec.visual).toBe('table');
  });

  it('returns chips for nominal identify with cardinality > 3', () => {
    const d = createDatum({
      ...baseInput,
      task: 'identify',
      dataKind: 'nominal',
      value: ['a', 'b', 'c', 'd'],
    });
    const spec = selectVisual(d, { cardinality: 4 });
    expect(spec.visual).toBe('chips');
  });

  it('returns text for textual identify', () => {
    const d = createDatum({
      ...baseInput,
      task: 'identify',
      dataKind: 'textual',
      value: 'hello world',
    });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('text');
  });

  it('returns dot-plot for compare with sharedScale', () => {
    const d = createDatum({ ...baseInput, task: 'compare' });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('dot-plot');
    expect(spec.sharedScale).toBe(true);
    expect(spec.directLabels).toBe(true);
  });

  it('returns bar for rank with ordered + sharedScale', () => {
    const d = createDatum({ ...baseInput, task: 'rank' });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('bar');
    expect(spec.ordered).toBe(true);
    expect(spec.sharedScale).toBe(true);
  });

  it('returns line for trend with temporal data', () => {
    const d = createDatum({ ...baseInput, task: 'trend', dataKind: 'temporal' });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('line');
  });

  it('returns bar for trend with non-temporal data', () => {
    const d = createDatum({ ...baseInput, task: 'trend', dataKind: 'quantitative' });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('bar');
  });

  it('returns histogram for distribution (single)', () => {
    const d = createDatum({ ...baseInput, task: 'distribution' });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('histogram');
  });

  it('returns box-plot for distribution (multi cardinality)', () => {
    const d = createDatum({ ...baseInput, task: 'distribution' });
    const spec = selectVisual(d, { cardinality: 3 });
    expect(spec.visual).toBe('box-plot');
  });

  it('returns stacked-bar for composition', () => {
    const d = createDatum({ ...baseInput, task: 'composition' });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('stacked-bar');
    expect(spec.sharedScale).toBe(true);
  });

  it('returns bullet for deviation with showTarget', () => {
    const d = createDatum({ ...baseInput, task: 'deviation', target: 0.75 });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('bullet');
    expect(spec.showTarget).toBe(true);
  });

  it('returns bullet for deviation without target (showTarget=false)', () => {
    const d = createDatum({ ...baseInput, task: 'deviation' });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('bullet');
    expect(spec.showTarget).toBe(false);
  });

  it('returns scatter for correlation', () => {
    const d = createDatum({ ...baseInput, task: 'correlation' });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('scatter');
  });

  it('returns timeline for trace', () => {
    const d = createDatum({ ...baseInput, task: 'trace' });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('timeline');
    expect(spec.directLabels).toBe(true);
  });

  it('returns sankey for flow', () => {
    const d = createDatum({ ...baseInput, task: 'flow' });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('sankey');
  });

  it('returns tree for hierarchy', () => {
    const d = createDatum({ ...baseInput, task: 'hierarchy' });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('tree');
  });

  it('returns inspector for inspect with exceptionFirst', () => {
    const d = createDatum({ ...baseInput, task: 'inspect' });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('inspector');
    expect(spec.exceptionFirst).toBe(true);
  });
});

describe('selectVisual — role override', () => {
  it('returns identifier for evidence role', () => {
    const d = createDatum({
      ...baseInput,
      task: 'identify',
      role: 'evidence',
    });
    const spec = selectVisual(d);
    expect(spec.visual).toBe('identifier');
  });
});

describe('selectVisual — uncertainty propagation', () => {
  it('showUncertainty=true for compare with uncertainty', () => {
    const d = createDatum({
      ...baseInput,
      task: 'compare',
      uncertainty: { lower: 0.4, upper: 0.6 },
    });
    const spec = selectVisual(d);
    expect(spec.showUncertainty).toBe(true);
  });

  it('showUncertainty=false for compare without uncertainty', () => {
    const d = createDatum({ ...baseInput, task: 'compare' });
    const spec = selectVisual(d);
    expect(spec.showUncertainty).toBe(false);
  });
});