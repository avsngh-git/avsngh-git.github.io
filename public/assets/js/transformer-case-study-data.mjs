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
