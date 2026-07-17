import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const siteRoot = process.env.JEKYLL_DESTINATION
  ? path.resolve(process.env.JEKYLL_DESTINATION) : path.join(root, "_site");
const projectsIndex = path.join(siteRoot, "projects/index.html");
const caseStudyPage = path.join(siteRoot, "projects/transformer-variants.html");

test("rendered Projects page exposes the case study and an accessible GitHub icon", async () => {
  const html = await readFile(projectsIndex, "utf8");

  assert.match(html, /Transformer Variants: Controlled Experiments/);
  assert.match(html, /href="\/Portfoliogithubpages\/projects\/transformer-variants"/);
  assert.match(html, /aria-label="View TransformerVariants on GitHub"/);
});

test("rendered case study contains the agreed recruiter narrative", async () => {
  const html = await readFile(caseStudyPage, "utf8");
  const requiredSections = [
    "variant-taxonomy",
    "experimental-protocol",
    "training-recipe",
    "results",
    "throughput",
    "model-internals",
    "design-choices",
    "limitations",
  ];

  assert.match(html, /id="transformer-case-study"/);
  for (const section of requiredSections) {
    assert.match(html, new RegExp(`id="${section}"`));
  }
  assert.match(html, /21e3cf2/);
  assert.match(html, /aria-label="View TransformerVariants on GitHub"/);
  assert.equal((html.match(/class="figure-interpretation"/g) ?? []).length >= 7, true);
});

test("rendered case-study assets are local and resolvable", async () => {
  const html = await readFile(caseStudyPage, "utf8");
  const references = [...html.matchAll(/data-case-asset (?:href|src)="([^"]+)"/g)].map(
    (match) => match[1],
  );

  assert.equal(references.length >= 6, true);
  for (const reference of references) {
    assert.match(reference, /^\/Portfoliogithubpages\/assets\//);
    const sitePath = reference.replace("/Portfoliogithubpages/", "");
    await access(path.join(siteRoot, sitePath));
  }
});
