/**
 * @typedef {"trainingTokensPerSecond" |
 * "cachedGenerationTokensPerSecond" |
 * "cachedDecodeTokensPerSecond" |
 * "uncachedGenerationTokensPerSecond" |
 * "prefillTokensPerSecond4k"} NumericMetricKey
 */

/** @typedef {"tailPerplexity" | "prefillTokensPerSecond"} ContextMetricKey */

function assertSummary(summary) {
  if (!summary || !Array.isArray(summary.variants)) {
    throw new TypeError("Expected a case-study summary with a variants array.");
  }
}

export function buildComparisonRows(summary) {
  assertSummary(summary);
  return summary.variants.map((variant) => ({ ...variant }));
}

/** @param {unknown} summary @param {NumericMetricKey} metric */
export function metricSeries(summary, metric) {
  assertSummary(summary);
  return summary.variants
    .filter((variant) => typeof variant[metric] === "number")
    .map((variant) => ({ variant: variant.variant, value: variant[metric] }));
}

/** @param {unknown} summary @param {NumericMetricKey} metric */
export function throughputExtremes(summary, metric) {
  const ranked = metricSeries(summary, metric).sort((a, b) => b.value - a.value);
  if (!ranked.length) {
    throw new RangeError(`No measured values for throughput metric: ${metric}`);
  }
  const leader = ranked[0];
  const laggard = ranked.at(-1);
  return {
    leader,
    laggard,
    ratio: leader.value / laggard.value,
    measuredCount: ranked.length,
  };
}

export function commonBudgetSnapshot(summary, axis) {
  const curves = summary?.trainingCurves?.[axis];
  if (!curves || typeof curves !== "object") {
    throw new TypeError(`Unknown learning-curve axis: ${axis}`);
  }
  const entries = Object.entries(curves).filter(([, curve]) =>
    Array.isArray(curve?.x) && curve.x.length && Array.isArray(curve?.mean));
  if (!entries.length) {
    throw new RangeError(`No learning curves for axis: ${axis}`);
  }
  const budget = Math.min(...entries.map(([, curve]) => curve.x.at(-1)));
  const measured = entries.map(([variant, curve]) => {
    let upper = curve.x.findIndex((value) => value >= budget);
    if (upper < 0) upper = curve.x.length - 1;
    if (upper === 0 || curve.x[upper] === budget) {
      return {
        variant,
        budget,
        loss: curve.mean[upper],
      };
    }
    const lower = upper - 1;
    const progress = (budget - curve.x[lower])
      / (curve.x[upper] - curve.x[lower]);
    return {
      variant,
      budget,
      loss: curve.mean[lower]
        + progress * (curve.mean[upper] - curve.mean[lower]),
    };
  }).sort((left, right) => left.loss - right.loss);
  return {
    budget,
    leader: measured[0],
    laggard: measured.at(-1),
    measuredCount: measured.length,
  };
}

/** @param {unknown} summary @param {ContextMetricKey} metric */
export function contextSeries(summary, metric) {
  const metricValues = summary?.contextMetrics?.[metric];
  if (!metricValues || typeof metricValues !== "object") {
    throw new TypeError(`Unknown context metric: ${metric}`);
  }
  return Object.entries(metricValues).map(([variant, points]) => ({ variant, points }));
}

export function attentionAssetFor(index, variant) {
  const match = index?.variants?.find((entry) => entry.variant === variant);
  return match ?? { variant, status: "missing", reason: "No attention asset is indexed." };
}

export function summarizeRetrievalHeatmap(rows, contexts) {
  const measurements = rows.flatMap(({ variant, cells }) =>
    cells.flatMap((cell, index) =>
      typeof cell?.mean === "number"
        ? [{ variant, context: contexts[index], mean: cell.mean }]
        : []));
  if (!measurements.length) return null;
  const ordered = [...measurements].sort((left, right) => left.mean - right.mean);
  return {
    mean: measurements.reduce((sum, point) => sum + point.mean, 0)
      / measurements.length,
    positiveCount: measurements.filter(({ mean }) => mean > 0).length,
    measuredCount: measurements.length,
    strongest: ordered.at(-1),
    weakest: ordered[0],
  };
}

export function summarizeRoutingUtilization(seedValues, entropies, maximumEntropy) {
  if (!seedValues.length || !seedValues[0]?.length) return null;
  const experts = seedValues[0].map((_, expert) => ({
    expert,
    mean: seedValues.reduce((sum, values) => sum + values[expert], 0)
      / seedValues.length,
  }));
  const ordered = [...experts].sort((left, right) => left.mean - right.mean);
  const entropy = entropies.length
    ? entropies.reduce((sum, value) => sum + value, 0) / entropies.length
    : null;
  return {
    experts,
    mostUsed: ordered.at(-1),
    leastUsed: ordered[0],
    spread: ordered.at(-1).mean - ordered[0].mean,
    entropy,
    normalizedEntropy: typeof entropy === "number" && maximumEntropy > 0
      ? entropy / maximumEntropy
      : null,
  };
}

export function summarizeAttentionWeights(weights) {
  if (!Array.isArray(weights) || !weights.length) return null;
  const rows = weights.flatMap((row, query) => {
    const total = row.reduce((sum, value) => sum + value, 0);
    if (!(total > 0)) return [];
    const selfMass = row[query] ?? 0;
    const recentMass = row.reduce((sum, value, key) =>
      key <= query && query - key <= 4 ? sum + value : sum, 0);
    const meanBackwardDistance = row.reduce((sum, value, key) =>
      key <= query ? sum + value * (query - key) : sum, 0);
    return [{
      selfMass: selfMass / total,
      recentMass: recentMass / total,
      meanBackwardDistance: meanBackwardDistance / total,
    }];
  });
  const average = (key) =>
    rows.reduce((sum, row) => sum + row[key], 0) / rows.length;
  return {
    selfMass: average("selfMass"),
    recentMass: average("recentMass"),
    meanBackwardDistance: average("meanBackwardDistance"),
  };
}

export function fillTemplate(template, values) {
  return template.replace(
    /\[\[(\w+)\]\]/g,
    (_, key) => values[key] ?? "",
  );
}
