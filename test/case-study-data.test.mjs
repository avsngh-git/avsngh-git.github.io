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
const internals = JSON.parse(
  await readFile(
    new URL("../assets/data/transformer-variants/model_internals.json", import.meta.url),
    "utf8",
  ),
);
const routing = JSON.parse(
  await readFile(
    new URL("../assets/data/transformer-variants/moe_routing.json", import.meta.url),
    "utf8",
  ),
);
const retrieval = JSON.parse(
  await readFile(
    new URL("../assets/data/transformer-variants/retrieval.json", import.meta.url),
    "utf8",
  ),
);

test("comparison rows preserve measured values and unsupported states", () => {
  const rows = buildComparisonRows(summary);
  const byVariant = Object.fromEntries(rows.map((row) => [row.variant, row]));

  assert.equal(summary.schemaVersion, 2);
  assert.equal(summary.study.runCount, 50);
  assert.equal(summary.study.seedCount, 5);
  assert.equal(summary.study.tokensPerSeed, 499_974_144);
  assert.equal(summary.study.totalTrainingTokens, 24_998_707_200);
  assert.equal(summary.provenance.benchmarkSettings.generation_checkpoint_seed, 42);
  assert.deepEqual(summary.provenance.benchmarkSettings.prompt_lengths, [64]);
  assert.deepEqual(summary.provenance.benchmarkSettings.generation_batch_sizes, [1]);
  assert.equal(summary.provenance.benchmarkSettings.repeats, 30);
  assert.equal(summary.provenance.benchmarkSettings.warmups, 10);
  assert.equal(rows.length, 10);
  for (const row of rows) {
    assert.equal(row.fixedDataLoss.n, 5);
    assert.equal(row.seedLosses.length, 5);
    assert.equal(Number.isFinite(row.fixedDataLoss.mean), true);
    assert.equal(Number.isFinite(row.activeParameters), true);
    assert.equal(Number.isFinite(row.totalParameters), true);
    assert.equal(row.generationCheckpointSeed, 42);
  }
  assert.equal(byVariant.vanilla.tailPerplexity4k.status, "unsupported");
});

test("metric series excludes unsupported values without inventing zeros", () => {
  const series = metricSeries(summary, "prefillTokensPerSecond4k");

  assert.equal(series.length > 0, true);
  assert.equal(series.every((point) => point.value > 0), true);
  assert.equal(series.some((point) => point.variant === "vanilla"), false);
});

test("context series preserves context order, uncertainty, and extrapolation gaps", () => {
  const series = contextSeries(summary, "tailPerplexity");
  const alibi = series.find((entry) => entry.variant === "alibi");
  const vanilla = series.find((entry) => entry.variant === "vanilla");

  assert.deepEqual(alibi.points.map((point) => point.context), [1024, 2048, 4096]);
  assert.equal(alibi.points.every((point) => point.status === "ok"), true);
  assert.equal(alibi.points.every((point) => point.n === 5), true);
  assert.equal(vanilla.points[1].status, "unsupported");
  assert.equal(vanilla.points[2].mean, null);
});

test("context selectors cover every recipe for quality and prefill throughput", () => {
  const quality = contextSeries(summary, "tailPerplexity");
  const prefill = contextSeries(summary, "prefillTokensPerSecond");

  assert.equal(quality.length, 10);
  assert.equal(prefill.length, 10);
  assert.equal(quality.every((entry) => entry.points.length === 3), true);
  assert.equal(
    prefill
      .filter((entry) => entry.variant !== "vanilla")
      .every((entry) => entry.points[2].mean > 0),
    true,
  );
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

test("internal diagnostics retain five-seed uncertainty for every recipe", () => {
  assert.equal(Object.keys(internals.variants).length, 10);
  for (const payload of Object.values(internals.variants)) {
    assert.equal(payload.n_seeds, 5);
    assert.equal(payload.stable_rank.per_layer.length, 8);
    assert.equal(payload.stable_rank.per_layer_std.length, 8);
    assert.equal(payload.cka.adjacent_curve.length, 7);
    assert.equal(payload.cka.adjacent_curve_std.length, 7);
  }
});

test("routing data covers five seeds for all three MoE placements", () => {
  assert.equal(routing.runs.length, 15);
  for (const variant of ["moe", "moe_deep", "moe_interleaved"]) {
    const runs = routing.runs.filter((run) => run.variant === variant);
    assert.deepEqual(
      runs.map((run) => run.seed).sort((left, right) => left - right),
      [42, 137, 2024, 31415, 271828],
    );
    const stability = routing.cross_seed_routing_stability.variants[variant];
    assert.equal(stability.pairwise.length, 10);
    assert.equal(Object.keys(stability.per_layer).length > 0, true);
  }
});

test("retrieval data covers all checkpoints and preserves the observed floor", () => {
  assert.equal(retrieval.checkpoints.length, 50);
  assert.equal(retrieval.checkpoints.every((run) => run.status === "ok"), true);
  assert.deepEqual(retrieval.settings.context_lengths, [512, 1024, 2048, 4096]);
  assert.deepEqual(retrieval.settings.tasks, ["passkey", "needle"]);

  const supported = [];
  for (const configurations of Object.values(retrieval.aggregate)) {
    for (const tasks of Object.values(configurations)) {
      for (const contexts of Object.values(tasks)) {
        for (const payload of Object.values(contexts)) {
          if (payload.status === "ok" || payload.status === "partial") supported.push(payload);
        }
      }
    }
  }
  assert.equal(supported.length > 0, true);
  assert.equal(supported.every((payload) => payload.accuracy.mean === 0), true);
  assert.equal(supported.every((payload) => payload.top5_accuracy.mean === 0), true);
});
