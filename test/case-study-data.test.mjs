import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  attentionAssetFor,
  buildComparisonRows,
  contextSeries,
  metricSeries,
} from "../assets/js/transformer-case-study-data.mjs";

const summary = JSON.parse(
  await readFile(
    new URL("../assets/data/transformer-variants/summary.json", import.meta.url),
    "utf8",
  ),
);

test("comparison rows preserve measured values and unsupported states", () => {
  const rows = buildComparisonRows(summary);
  const byVariant = Object.fromEntries(rows.map((row) => [row.variant, row]));

  assert.equal(rows.length, 10);
  assert.equal(byVariant.moe.fixedDataLoss.mean, 3.4292);
  assert.equal(byVariant.vanilla.generationTokensPerSecond, 454.55);
  assert.equal(byVariant.alibi.tailPerplexity4k.mean, 58.74);
  assert.equal(byVariant.vanilla.tailPerplexity4k.status, "unsupported");
  assert.equal(byVariant.modern.cacheStatus, "ok");
  assert.equal(byVariant.alibi.cacheStatus, "unsupported");
});

test("metric series excludes unsupported values without inventing zeros", () => {
  const series = metricSeries(summary, "prefillTokensPerSecond4k");

  assert.equal(series.length, 9);
  assert.equal(series.some((point) => point.variant === "vanilla"), false);
  assert.equal(series.find((point) => point.variant === "swa").value, 253394.52);
});

test("context series preserves context order, uncertainty, and extrapolation gaps", () => {
  const series = contextSeries(summary, "tailPerplexity");
  const alibi = series.find((entry) => entry.variant === "alibi");
  const vanilla = series.find((entry) => entry.variant === "vanilla");

  assert.deepEqual(alibi.points.map((point) => point.context), [1024, 2048, 4096]);
  assert.deepEqual(alibi.points.map((point) => point.mean), [56.07, 58.29, 58.74]);
  assert.equal(alibi.points[2].std, 1.1);
  assert.equal(vanilla.points[1].status, "unsupported");
  assert.equal(vanilla.points[2].mean, null);
});

test("context selectors cover every recipe for quality and prefill throughput", () => {
  const quality = contextSeries(summary, "tailPerplexity");
  const prefill = contextSeries(summary, "prefillTokensPerSecond");

  assert.equal(quality.length, 10);
  assert.equal(prefill.length, 10);
  assert.equal(quality.every((entry) => entry.points.length === 3), true);
  assert.equal(prefill.find((entry) => entry.variant === "linear").points[2].mean, 34698.55);
  assert.equal(prefill.find((entry) => entry.variant === "vanilla").points[1].status, "unsupported");
});

test("attention lookup returns lazy assets and explicit unsupported reasons", () => {
  const index = {
    variants: [
      { variant: "modern", status: "supported", asset: "attention_patterns_modern.json" },
      { variant: "linear", status: "unsupported", reason: "No pairwise softmax matrix." },
    ],
  };

  assert.equal(attentionAssetFor(index, "modern").asset, "attention_patterns_modern.json");
  assert.equal(attentionAssetFor(index, "linear").status, "unsupported");
  assert.equal(attentionAssetFor(index, "missing").status, "missing");
});
