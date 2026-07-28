import { describe, expect, it } from "vitest";

import {
  attentionAssetFor,
  buildComparisonRows,
  contextSeries,
  metricSeries,
  throughputExtremes,
} from "../../../public/assets/js/transformer-case-study-data.mjs";

const summary = {
  variants: [
    {
      variant: "modern",
      fixedDataLoss: { mean: 3.8 },
      prefillTokensPerSecond4k: 120_000,
    },
    {
      variant: "vanilla",
      fixedDataLoss: { mean: 3.94 },
      prefillTokensPerSecond4k: null,
    },
    {
      variant: "linear",
      fixedDataLoss: { mean: 4.08 },
      prefillTokensPerSecond4k: 40_000,
    },
  ],
  contextMetrics: {
    tailPerplexity: {
      modern: [{ context: 1024, mean: 49.96 }],
      vanilla: [{ context: 1024, mean: 60.0 }],
    },
  },
};

describe("production case-study data transforms", () => {
  it("preserves comparison rows without mutating the source", () => {
    const rows = buildComparisonRows(summary);
    expect(rows).toEqual(summary.variants);
    expect(rows).not.toBe(summary.variants);
  });

  it("excludes unsupported metric values without inventing zeroes", () => {
    expect(metricSeries(summary, "prefillTokensPerSecond4k")).toEqual([
      { variant: "modern", value: 120_000 },
      { variant: "linear", value: 40_000 },
    ]);
  });

  it("identifies the measured throughput leader, laggard, and speed ratio", () => {
    expect(throughputExtremes(summary, "prefillTokensPerSecond4k")).toEqual({
      leader: { variant: "modern", value: 120_000 },
      laggard: { variant: "linear", value: 40_000 },
      ratio: 3,
      measuredCount: 2,
    });
  });

  it("preserves context order and returns explicit attention fallbacks", () => {
    expect(contextSeries(summary, "tailPerplexity")[0]).toEqual({
      variant: "modern",
      points: [{ context: 1024, mean: 49.96 }],
    });
    expect(
      attentionAssetFor(
        {
          variants: [
            {
              variant: "linear",
              status: "unsupported",
              reason: "No pairwise softmax matrix.",
            },
          ],
        },
        "missing",
      ),
    ).toEqual({
      variant: "missing",
      status: "missing",
      reason: "No attention asset is indexed.",
    });
  });
});
