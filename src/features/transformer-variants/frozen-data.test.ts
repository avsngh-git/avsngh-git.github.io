import { readFile } from "node:fs/promises";

// @ts-expect-error The production browser helper is intentionally shipped as ESM JavaScript.
import { attentionAssetFor, buildComparisonRows, contextSeries, metricSeries } from "../../../public/assets/js/transformer-case-study-data.mjs";

async function readJson(relativePath: string) {
  return JSON.parse(
    await readFile(new URL(relativePath, import.meta.url), "utf8"),
  ) as unknown;
}

type FullVariant = {
  variant: string;
  fixedDataLoss: { mean: number; n: number };
  seedLosses: unknown[];
  activeParameters: number;
  totalParameters: number;
  generationCheckpointSeed: number;
  tailPerplexity4k: { status: string };
};

type SummaryPayload = {
  schemaVersion: number;
  study: {
    runCount: number;
    seedCount: number;
    tokensPerSeed: number;
    totalTrainingTokens: number;
  };
  provenance: {
    benchmarkSettings: { generation_checkpoint_seed: number };
  };
  variants: FullVariant[];
  contextMetrics: Record<string, Record<string, ContextPoint[]>>;
};

type ContextPoint = {
  context: number;
  mean: number | null;
  n?: number;
  status: string;
};

type InternalsPayload = {
  variants: Record<
    string,
    {
      n_seeds: number;
      stable_rank: { per_layer: number[]; per_layer_std: number[] };
      cka: { adjacent_curve: number[]; adjacent_curve_std: number[] };
    }
  >;
};

type RoutingPayload = {
  runs: Array<{ variant: string; seed: number }>;
  cross_seed_routing_stability: {
    variants: Record<string, { pairwise: unknown[] }>;
  };
};

type RetrievalResult = {
  status: string;
  accuracy: { mean: number };
  top5_accuracy: { mean: number };
};

type RetrievalPayload = {
  checkpoints: Array<{ status: string }>;
  settings: { context_lengths: number[]; tasks: string[] };
  aggregate: Record<
    string,
    Record<
      string,
      Record<string, Record<string, RetrievalResult>>
    >
  >;
};

const [summary, internals, routing, retrieval] = await Promise.all([
  readJson("../../../public/assets/data/transformer-variants/summary.json"),
  readJson("../../../public/assets/data/transformer-variants/model_internals.json"),
  readJson("../../../public/assets/data/transformer-variants/moe_routing.json"),
  readJson("../../../public/assets/data/transformer-variants/retrieval.json"),
]) as [SummaryPayload, InternalsPayload, RoutingPayload, RetrievalPayload];

describe("frozen Transformer Variants evidence", () => {
  it("preserves measured comparison values and unsupported states", () => {
    const rows = buildComparisonRows(summary) as FullVariant[];
    const byVariant = Object.fromEntries(rows.map((row) => [row.variant, row]));

    expect(summary.schemaVersion).toBe(2);
    expect(summary.study.runCount).toBe(50);
    expect(summary.study.seedCount).toBe(5);
    expect(summary.study.tokensPerSeed).toBe(499_974_144);
    expect(summary.study.totalTrainingTokens).toBe(24_998_707_200);
    expect(summary.provenance.benchmarkSettings.generation_checkpoint_seed).toBe(42);
    expect(rows).toHaveLength(10);
    for (const row of rows) {
      expect(row.fixedDataLoss.n).toBe(5);
      expect(row.seedLosses).toHaveLength(5);
      expect(Number.isFinite(row.fixedDataLoss.mean)).toBe(true);
      expect(Number.isFinite(row.activeParameters)).toBe(true);
      expect(Number.isFinite(row.totalParameters)).toBe(true);
      expect(row.generationCheckpointSeed).toBe(42);
    }
    expect(byVariant.vanilla.tailPerplexity4k.status).toBe("unsupported");
  });

  it("never converts unsupported metric values into zeroes", () => {
    const series = metricSeries(summary, "prefillTokensPerSecond4k") as Array<{
      variant: string;
      value: number;
    }>;

    expect(series.length).toBeGreaterThan(0);
    expect(series.every((point) => point.value > 0)).toBe(true);
    expect(series.some((point) => point.variant === "vanilla")).toBe(false);
  });

  it("retains ordered context uncertainty and extrapolation gaps", () => {
    const series = contextSeries(summary, "tailPerplexity") as Array<{
      variant: string;
      points: ContextPoint[];
    }>;
    const alibi = series.find((entry) => entry.variant === "alibi");
    const vanilla = series.find((entry) => entry.variant === "vanilla");

    expect(alibi?.points.map((point) => point.context)).toEqual([
      1024, 2048, 4096,
    ]);
    expect(alibi?.points.every((point) => point.status === "ok")).toBe(true);
    expect(alibi?.points.every((point) => point.n === 5)).toBe(true);
    expect(vanilla?.points[1].status).toBe("unsupported");
    expect(vanilla?.points[2].mean).toBeNull();
  });

  it("retains five-seed internal diagnostics for every recipe", () => {
    expect(Object.keys(internals.variants)).toHaveLength(10);
    for (const payload of Object.values(internals.variants)) {
      expect(payload.n_seeds).toBe(5);
      expect(payload.stable_rank.per_layer).toHaveLength(8);
      expect(payload.stable_rank.per_layer_std).toHaveLength(8);
      expect(payload.cka.adjacent_curve).toHaveLength(7);
      expect(payload.cka.adjacent_curve_std).toHaveLength(7);
    }
  });

  it("retains five seeds for all three MoE placements", () => {
    expect(routing.runs).toHaveLength(15);
    for (const variant of ["moe", "moe_deep", "moe_interleaved"]) {
      const runs = routing.runs.filter((run) => run.variant === variant);
      expect(runs.map((run) => run.seed).sort((a, b) => a - b))
        .toEqual([42, 137, 2024, 31415, 271828]);
      expect(
        routing.cross_seed_routing_stability.variants[variant].pairwise,
      ).toHaveLength(10);
    }
  });

  it("retains all zero-shot retrieval checkpoints and the observed floor", () => {
    expect(retrieval.checkpoints).toHaveLength(50);
    expect(retrieval.checkpoints.every((run) => run.status === "ok")).toBe(
      true,
    );
    expect(retrieval.settings.context_lengths).toEqual([512, 1024, 2048, 4096]);
    expect(retrieval.settings.tasks).toEqual(["passkey", "needle"]);

    const supported: RetrievalResult[] = [];
    for (const configurations of Object.values(retrieval.aggregate)) {
      for (const tasks of Object.values(configurations)) {
        for (const contexts of Object.values(tasks)) {
          for (const payload of Object.values(contexts)) {
            if (payload.status === "ok" || payload.status === "partial") {
              supported.push(payload);
            }
          }
        }
      }
    }
    expect(supported.length).toBeGreaterThan(0);
    expect(supported.every((payload) => payload.accuracy.mean === 0)).toBe(true);
    expect(supported.every((payload) => payload.top5_accuracy.mean === 0)).toBe(
      true,
    );
  });

  it("keeps attention assets lazy and unsupported reasons explicit", () => {
    const index = {
      variants: [
        {
          variant: "modern",
          status: "supported",
          asset: "attention_patterns_modern.json",
        },
        {
          variant: "linear",
          status: "unsupported",
          reason: "No pairwise softmax matrix.",
        },
      ],
    };

    expect(attentionAssetFor(index, "modern").asset).toBe(
      "attention_patterns_modern.json",
    );
    expect(attentionAssetFor(index, "linear").status).toBe("unsupported");
    expect(attentionAssetFor(index, "missing").status).toBe("missing");
  });
});
