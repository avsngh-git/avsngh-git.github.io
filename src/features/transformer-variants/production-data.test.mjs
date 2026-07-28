import { describe, expect, it } from "vitest";

import {
  attentionAssetFor,
  buildComparisonRows,
  commonBudgetSnapshot,
  contextSeries,
  fillTemplate,
  metricSeries,
  summarizeAttentionWeights,
  summarizeRetrievalHeatmap,
  summarizeRoutingUtilization,
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
  trainingCurves: {
    tokens: {
      modern: { x: [10, 20], mean: [5, 4] },
      moe: { x: [10, 20], mean: [4.8, 3.8] },
    },
    wallclock: {
      modern: { x: [5, 10], mean: [5, 4] },
      moe: { x: [8, 16], mean: [4.7, 3.7] },
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

  it("compares learning curves at the longest budget shared by every recipe", () => {
    expect(commonBudgetSnapshot(summary, "wallclock")).toEqual({
      budget: 10,
      leader: { variant: "modern", budget: 10, loss: 4 },
      laggard: { variant: "moe", budget: 10, loss: 4.45 },
      measuredCount: 2,
    });
  });

  it("summarizes the selected retrieval heatmap without hiding negative cells", () => {
    expect(
      summarizeRetrievalHeatmap(
        [
          { variant: "modern", cells: [{ mean: 0.2 }, { mean: -0.1 }] },
          { variant: "alibi", cells: [{ mean: 0.5 }, { mean: 0.1 }] },
        ],
        [512, 1024],
      ),
    ).toEqual({
      mean: 0.175,
      positiveCount: 3,
      measuredCount: 4,
      strongest: { variant: "alibi", context: 512, mean: 0.5 },
      weakest: { variant: "modern", context: 1024, mean: -0.1 },
      byVariant: [
        { variant: "alibi", mean: 0.3, measuredCount: 2 },
        { variant: "modern", mean: 0.05, measuredCount: 2 },
      ],
      closestPairs: [{
        left: { variant: "alibi", mean: 0.3, measuredCount: 2 },
        right: { variant: "modern", mean: 0.05, measuredCount: 2 },
        gap: 0.25,
      }],
    });
  });

  it("summarizes expert balance and selected attention-map locality", () => {
    const routing = summarizeRoutingUtilization(
      [
        [0.1, 0.2, 0.7],
        [0.2, 0.2, 0.6],
      ],
      [1, 1.1],
      Math.log(3),
    );
    expect(routing.mostUsed.expert).toBe(2);
    expect(routing.mostUsed.mean).toBeCloseTo(0.65);
    expect(routing.leastUsed.expert).toBe(0);
    expect(routing.leastUsed.mean).toBeCloseTo(0.15);
    expect(routing.spread).toBeCloseTo(0.5);
    expect(routing.entropy).toBeCloseTo(1.05);
    expect(
      summarizeAttentionWeights([
        [1, 0, 0],
        [0.5, 0.5, 0],
        [0, 0.5, 0.5],
      ]),
    ).toEqual({
      selfMass: 2 / 3,
      recentMass: 1,
      meanBackwardDistance: 1 / 3,
    });
  });

  it("fills only declared story placeholders", () => {
    expect(
      fillTemplate("[[leader]] at [[value]]; [[missing]]", {
        leader: "Modern",
        value: "3.8",
      }),
    ).toBe("Modern at 3.8; ");
  });
});
