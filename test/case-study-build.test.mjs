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
  assert.match(html, /href="\/Portfoliogithubpages\/projects\/transformer-variants"/);
  assert.match(html, /aria-label="View TransformerVariants on GitHub"/);
});

test("case study renders as a five-chapter series with persistent navigation", async () => {
  for (const [chapter, output] of chapters) {
    const html = await readFile(path.join(siteRoot, output), "utf8");
    assert.match(html, new RegExp(`data-case-chapter="${chapter}"`));
    assert.equal((html.match(/class="tvc-chapter-link/g) ?? []).length, 5);
    assert.match(html, new RegExp(`data-chapter="${chapter}"[^>]*aria-current="page"`));
    assert.match(html, /aria-label="Transformer Variants case-study chapters"/);
    assert.match(html, /21e3cf2/);
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

test("results and internals use full-width figures and prominent interactive prompts", async () => {
  const results = await chapterHtml("results");
  const internals = await chapterHtml("internals");

  assert.doesNotMatch(results + internals, /tvc-paired-figure/);
  assert.match(internals, /id="stable-rank-figure"/);
  assert.match(internals, /id="cka-figure"/);
  assert.equal((results.match(/class="tvc-interactive-prompt/g) ?? []).length >= 3, true);
  assert.equal((results.match(/class="figure-interpretation/g) ?? []).length >= 4, true);
  assert.match(results, /id="variant-comparison"/);
  assert.match(internals, /id="attention-canvas"/);
});

test("every case-study chapter references only resolvable local case assets", async () => {
  for (const [chapter] of chapters) {
    const html = await chapterHtml(chapter);
    const references = [...html.matchAll(/<[^>]*\bdata-case-asset\b[^>]*\b(?:href|src)="([^"]+)"/g)].map(
      (match) => match[1],
    );

    assert.equal(references.length >= 2, true, `${chapter} should load shared local assets`);
    for (const reference of references) {
      assert.match(reference, /^\/Portfoliogithubpages\/assets\//);
      const sitePath = reference.replace("/Portfoliogithubpages/", "");
      await access(path.join(siteRoot, sitePath));
    }
  }
});
