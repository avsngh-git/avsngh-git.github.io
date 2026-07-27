import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = process.env.JEKYLL_DESTINATION
  ? path.resolve(process.env.JEKYLL_DESTINATION)
  : path.join(root, "_site");
const chapters = [
  ["overview", "projects/transformer-variants.html"],
  ["architecture", "projects/transformer-variants/architecture/index.html"],
  ["experiments", "projects/transformer-variants/experiments/index.html"],
  ["results", "projects/transformer-variants/results/index.html"],
  ["internals", "projects/transformer-variants/internals/index.html"],
];

async function chapterHtml(chapter) {
  const entry = chapters.find(([name]) => name === chapter);
  return readFile(path.join(siteRoot, entry[1]), "utf8");
}

test("Projects page exposes the case-study card and accessible GitHub action", async () => {
  const html = await readFile(path.join(siteRoot, "projects/index.html"), "utf8");

  assert.match(html, /Transformer Variants: Controlled Experiments/);
  assert.match(html, /href="\/projects\/transformer-variants"/);
  assert.match(html, /aria-label="View TransformerVariants on GitHub"/);
});

test("case study renders as a five-chapter series with persistent navigation", async () => {
  for (const [chapter, output] of chapters) {
    const html = await readFile(path.join(siteRoot, output), "utf8");
    assert.match(html, new RegExp(`data-case-chapter="${chapter}"`));
    assert.equal((html.match(/class="tvc-chapter-link/g) ?? []).length, 5);
    assert.match(html, new RegExp(`data-chapter="${chapter}"[^>]*aria-current="page"`));
    assert.match(html, /aria-label="Transformer Variants case-study chapters"/);
    assert.match(html, /source commit recorded in the interactive data bundle/);
    assert.match(html, /https:\/\/github\.com\/avsngh-git\/TransformerVariants/);
  }
});

test("architecture chapter contrasts mechanisms, expectations, and observed effects", async () => {
  const html = await chapterHtml("architecture");
  const expectedTerms = [
    "Learned absolute positions",
    "Rotary position embeddings",
    "Attention with Linear Biases",
    "Full multi-head attention",
    "Grouped-query attention",
    "Sliding-window attention",
    "Causal linear attention",
    "Mixture of experts",
  ];

  for (const term of expectedTerms) assert.match(html, new RegExp(term));
  assert.equal((html.match(/Expected effect/g) ?? []).length >= 8, true);
  assert.equal((html.match(/Observed in this experiment/g) ?? []).length >= 8, true);
  assert.match(html, /id="position-encoding-comparison"/);
  assert.match(html, /id="attention-comparison"/);
  assert.match(html, /id="ffn-comparison"/);
});

test("results and internals use Plotly figures and prominent interactive prompts", async () => {
  const results = await chapterHtml("results");
  const internals = await chapterHtml("internals");

  assert.doesNotMatch(results + internals, /tvc-paired-figure/);
  assert.match(results, /id="fixed-data-chart"/);
  assert.match(results, /id="learning-curves-chart"/);
  assert.match(results, /id="pareto-chart"/);
  assert.match(results, /id="retrieval-chart"/);
  assert.match(results, /id="retrieval-configuration"/);
  assert.match(results, /id="retrieval-distance"/);
  assert.match(results, /RoPE base 100,000/);
  assert.doesNotMatch(results, /learning_curves_.*\.png|pareto_.*\.png/);
  assert.match(internals, /id="stable-rank-figure"/);
  assert.match(internals, /id="cka-figure"/);
  assert.match(internals, /id="stable-rank-chart"/);
  assert.match(internals, /id="cka-chart"/);
  assert.match(internals, /id="attention-chart"/);
  assert.match(internals, /id="routing-utilization-chart"/);
  assert.match(internals, /id="routing-stability-chart"/);
  assert.doesNotMatch(internals, /<canvas|stable_rank\.png|cka_adjacent\.png/);
  assert.equal((results.match(/class="tvc-interactive-prompt/g) ?? []).length >= 3, true);
  assert.equal((results.match(/class="figure-interpretation/g) ?? []).length >= 4, true);
  assert.equal(
    (results.match(/<figure\b/g) ?? []).length,
    (results.match(/class="figure-interpretation/g) ?? []).length,
    "every Results figure should have an explanatory caption",
  );
  assert.equal(
    (internals.match(/<figure\b/g) ?? []).length,
    (internals.match(/class="figure-interpretation/g) ?? []).length,
    "every Internals figure should have an explanatory caption",
  );
  assert.match(results, /id="variant-comparison"/);
});

test("case study loads a local Plotly runtime before its chart module", async () => {
  const html = await chapterHtml("results");
  const runtime = html.indexOf("/assets/js/plotly.min.js");
  const module = html.indexOf("/assets/js/transformer-case-study.mjs");

  assert.equal(runtime >= 0, true);
  assert.equal(module > runtime, true);
  await access(path.join(siteRoot, "assets/js/plotly.min.js"));
  const source = await readFile(
    path.join(root, "assets/js/transformer-case-study.mjs"),
    "utf8",
  );
  assert.match(source, /Plotly\.(?:newPlot|react)/);
  assert.match(source, /container\.replaceChildren\(\)/);
  assert.match(source, /MutationObserver/);
  assert.match(source, /attributeFilter: \["data-theme"\]/);
  assert.match(source, /aria-live/);
  assert.match(source, /Accessible chart data/);
  assert.match(source, /variantPayload\?\.\[configuration\] \|\| null/);
  assert.doesNotMatch(source, /Object\.values\(variantPayload/);
  await access(path.join(siteRoot, "assets/data/transformer-variants/retrieval.json"));
  await access(path.join(siteRoot, "assets/data/transformer-variants/moe_routing.json"));
});

test("every case-study chapter references only resolvable local case assets", async () => {
  for (const [chapter] of chapters) {
    const html = await chapterHtml(chapter);
    const references = [...html.matchAll(/<[^>]*\bdata-case-asset\b[^>]*\b(?:href|src)="([^"]+)"/g)].map(
      (match) => match[1],
    );

    assert.equal(references.length >= 1, true, `${chapter} should load shared local assets`);
    for (const reference of references) {
      assert.match(reference, /^\/assets\//);
      const sitePath = reference.slice(1);
      await access(path.join(siteRoot, sitePath));
    }
  }
});
