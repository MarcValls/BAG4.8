// BAGO visual grammar — semantic types
// Canon: .bago/forma/GRAMATICA_VISUAL.md §2

export type DataKind =
  | 'quantitative'
  | 'ordinal'
  | 'nominal'
  | 'temporal'
  | 'relational'
  | 'hierarchical'
  | 'textual'
  | 'spatial';

export type AnalyticTask =
  | 'identify'
  | 'compare'
  | 'rank'
  | 'trend'
  | 'distribution'
  | 'composition'
  | 'deviation'
  | 'correlation'
  | 'trace'
  | 'flow'
  | 'hierarchy'
  | 'inspect';

export type DatumRole = 'primary' | 'supporting' | 'diagnostic' | 'evidence';

export type Severity = 'neutral' | 'positive' | 'warning' | 'critical';

export interface Threshold {
  value: number;
  meaning: string;
  severity: Severity;
}

export interface Uncertainty {
  lower?: number;
  upper?: number;
  distribution?: number[];
  method?: string;
}

export interface Provenance {
  source?: string;
  timestamp?: string;
  receiptId?: string;
}

export interface SemanticDatum {
  id: string;
  label: string;
  value: unknown;
  dataKind: DataKind;
  task: AnalyticTask;
  role: DatumRole;
  unit?: string;
  domain?: [number, number];
  target?: number;
  thresholds?: Threshold[];
  uncertainty?: Uncertainty;
  provenance?: Provenance;
}

export type VisualKind =
  | 'text'
  | 'stat'
  | 'status'
  | 'dot-plot'
  | 'bar'
  | 'stacked-bar'
  | 'line'
  | 'stepper'
  | 'timeline'
  | 'scatter'
  | 'node-link'
  | 'adjacency-matrix'
  | 'tree'
  | 'treemap'
  | 'bullet'
  | 'histogram'
  | 'box-plot'
  | 'chips'
  | 'table'
  | 'formula'
  | 'identifier'
  | 'inspector'
  | 'sankey'
  | 'relation-sequence';

export interface VisualSpec {
  visual: VisualKind;
  sharedScale?: boolean;
  ordered?: boolean;
  showTarget?: boolean;
  showUncertainty?: boolean;
  directLabels?: boolean;
  exceptionFirst?: boolean;
}

export interface VisualContext {
  cardinality?: number;
  density?: number;
  availableSpace?: 'compact' | 'normal' | 'wide';
  audience?: 'operator' | 'developer' | 'auditor';
}