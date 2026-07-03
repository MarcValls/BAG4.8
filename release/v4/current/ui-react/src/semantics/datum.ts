// BAGO visual grammar — datum factory + validation
// Canon: .bago/forma/GRAMATICA_VISUAL.md §2

import type {
  SemanticDatum,
  DataKind,
  AnalyticTask,
  DatumRole,
} from './types';

const VALID_DATA_KINDS: ReadonlySet<DataKind> = new Set([
  'quantitative', 'ordinal', 'nominal', 'temporal',
  'relational', 'hierarchical', 'textual', 'spatial',
]);

const VALID_TASKS: ReadonlySet<AnalyticTask> = new Set([
  'identify', 'compare', 'rank', 'trend', 'distribution',
  'composition', 'deviation', 'correlation', 'trace',
  'flow', 'hierarchy', 'inspect',
]);

const VALID_ROLES: ReadonlySet<DatumRole> = new Set([
  'primary', 'supporting', 'diagnostic', 'evidence',
]);

export interface CreateDatumInput {
  id: string;
  label: string;
  value: unknown;
  dataKind: DataKind;
  task: AnalyticTask;
  role: DatumRole;
  unit?: string;
  domain?: [number, number];
  target?: number;
  thresholds?: SemanticDatum['thresholds'];
  uncertainty?: SemanticDatum['uncertainty'];
  provenance?: SemanticDatum['provenance'];
}

export function createDatum(input: CreateDatumInput): SemanticDatum {
  const errors = validateDatumInput(input);
  if (errors.length > 0) {
    throw new Error(`Invalid datum: ${errors.join('; ')}`);
  }
  return { ...input };
}

export function validateDatumInput(input: CreateDatumInput): string[] {
  const errors: string[] = [];

  if (!input.id || typeof input.id !== 'string') {
    errors.push('id must be a non-empty string');
  }
  if (!input.label || typeof input.label !== 'string') {
    errors.push('label must be a non-empty string');
  }
  if (input.value === undefined) {
    errors.push('value must not be undefined');
  }
  if (!VALID_DATA_KINDS.has(input.dataKind)) {
    errors.push(`dataKind "${input.dataKind}" is not valid`);
  }
  if (!VALID_TASKS.has(input.task)) {
    errors.push(`task "${input.task}" is not valid`);
  }
  if (!VALID_ROLES.has(input.role)) {
    errors.push(`role "${input.role}" is not valid`);
  }
  if (input.domain) {
    if (!Array.isArray(input.domain) || input.domain.length !== 2) {
      errors.push('domain must be [min, max]');
    } else if (input.domain[0] >= input.domain[1]) {
      errors.push('domain[0] must be < domain[1]');
    }
  }
  if (input.target !== undefined && typeof input.target !== 'number') {
    errors.push('target must be a number');
  }

  return errors;
}

export function isSemanticDatum(obj: unknown): obj is SemanticDatum {
  if (typeof obj !== 'object' || obj === null) return false;
  const d = obj as Record<string, unknown>;
  return (
    typeof d.id === 'string' &&
    typeof d.label === 'string' &&
    d.value !== undefined &&
    typeof d.dataKind === 'string' &&
    VALID_DATA_KINDS.has(d.dataKind as DataKind) &&
    typeof d.task === 'string' &&
    VALID_TASKS.has(d.task as AnalyticTask) &&
    typeof d.role === 'string' &&
    VALID_ROLES.has(d.role as DatumRole)
  );
}