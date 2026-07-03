// BAGO visual grammar — selectVisual implementation
// Canon: .bago/forma/GRAMATICA_VISUAL.md §3

import type { SemanticDatum, VisualSpec, VisualContext, AnalyticTask } from './types';

const TASK_TO_VISUAL: Record<AnalyticTask, VisualSpec['visual']> = {
  identify: 'stat',
  compare: 'dot-plot',
  rank: 'bar',
  trend: 'line',
  distribution: 'histogram',
  composition: 'stacked-bar',
  deviation: 'bullet',
  correlation: 'scatter',
  trace: 'timeline',
  flow: 'sankey',
  hierarchy: 'tree',
  inspect: 'inspector',
};

export function selectVisual(
  datum: SemanticDatum,
  ctx?: VisualContext,
): VisualSpec {
  const baseVisual = TASK_TO_VISUAL[datum.task];
  const spec: VisualSpec = { visual: baseVisual };

  const cardinality = ctx?.cardinality ?? 1;

  switch (datum.task) {
    case 'identify':
      spec.visual = cardinality > 1 ? 'table' : 'stat';
      spec.directLabels = true;
      break;

    case 'compare':
      spec.visual = 'dot-plot';
      spec.sharedScale = true;
      spec.directLabels = true;
      spec.showUncertainty = !!datum.uncertainty;
      break;

    case 'rank':
      spec.visual = 'bar';
      spec.ordered = true;
      spec.sharedScale = true;
      spec.directLabels = true;
      break;

    case 'trend':
      spec.visual = datum.dataKind === 'temporal' ? 'line' : 'bar';
      spec.directLabels = false;
      break;

    case 'distribution':
      spec.visual = cardinality > 1 ? 'box-plot' : 'histogram';
      spec.showUncertainty = !!datum.uncertainty;
      break;

    case 'composition':
      spec.visual = 'stacked-bar';
      spec.sharedScale = true;
      break;

    case 'deviation':
      spec.visual = 'bullet';
      spec.showTarget = datum.target !== undefined;
      spec.directLabels = true;
      break;

    case 'correlation':
      spec.visual = 'scatter';
      break;

    case 'trace':
      spec.visual = 'timeline';
      spec.directLabels = true;
      break;

    case 'flow':
      spec.visual = 'sankey';
      break;

    case 'hierarchy':
      spec.visual = 'tree';
      break;

    case 'inspect':
      spec.visual = 'inspector';
      spec.exceptionFirst = true;
      break;
  }

  if (datum.role === 'evidence') {
    spec.visual = 'identifier';
    spec.directLabels = true;
  }

  if (datum.dataKind === 'textual' && datum.task === 'identify') {
    spec.visual = 'text';
  }

  if (datum.dataKind === 'nominal' && datum.task === 'identify' && cardinality > 3) {
    spec.visual = 'chips';
    spec.directLabels = true;
  }

  return spec;
}

export { TASK_TO_VISUAL };