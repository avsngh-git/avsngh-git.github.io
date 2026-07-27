---
nav_exclude: true
---

# Transformer Variants case-study specification

## Purpose

Add a concise card to the portfolio Projects page and a dedicated recruiter-facing
case study titled **Transformer Variants: A Controlled 50-Run Study**. The primary
audience is ML research and engineering recruiters and hiring
managers. The central claim is that this is an end-to-end experimental platform, not
just a collection of model classes.

Source repository: <https://github.com/avsngh-git/TransformerVariants>

Primary experiment: ten recipes × five seeds × 499,974,144 tokens = 50 runs and
24,998,707,200 processed training tokens. Training provenance starts at `537da5f`;
the publication footer records the frozen evaluation/export commit.

## Five-chapter structure

The case study is a persistent five-page series rather than one long document. Every
chapter repeats the numbered navigation, current-page state, provenance, and previous
or next action.

1. **Overview** — research question, scale, three mechanism-led findings, and a map to
   the evidence.
2. **Architecture choices** — explicit comparisons of positional schemes, attention
   topologies, normalization, feed-forward networks, and MoE placement. Every mechanism
   states what is used, its expected effect, and what the experiment observed.
3. **Experimental design** — dataset preparation, training objective, AdamW recipe,
   fairness axes, long-context protocol, uncertainty, and exact recovery.
4. **Results** — five-seed uncertainty, learning histories, Pareto trade-offs, context
   extrapolation, zero-shot retrieval, cache-aware generation, prefill, and the
   sortable all-variant table.
5. **Internals & engineering** — separate stable-rank and CKA figures, the attention
   explorer, MoE utilization and aligned cross-seed routing stability, system
   decisions, fault tolerance, and limitations.

Routes are `/projects/transformer-variants`, followed by `/architecture/`,
`/experiments/`, `/results/`, and `/internals/` below that project path.

## Explanatory standard

Every major result follows **mechanism → evidence → caveat**. Every visualization has
nearby text explaining both what is shown and why it matters. Results are presented as
trade-offs rather than a universal leaderboard.

## Visual and interaction scope

1. Experimental protocol diagram.
2. Five-seed fixed-data quality with individual seed points and Student-t intervals.
3. Token, wall-clock, and FLOP learning curves selected one at a time.
4. Quality–compute Pareto plot.
5. Paired-tail long-context quality and zero-shot retrieval.
6. Cached end-to-end generation, steady-state decode, uncached generation, and
   long-prompt prefill as distinct workloads.
7. Stable-rank and CKA representation diagnostics as separate full-width figures.
8. Selectable attention-pattern gallery.
9. MoE expert utilization and label-aligned cross-seed routing stability.

Every visualization carries an interpretive caption below it. Interactive areas use a
blue bordered prompt, blue controls, focus states, and explicit text describing what
will change. Use local, progressively enhanced JavaScript with static fallbacks, a
sortable comparison table, and lazy attention payloads. Use native MathML, accessible
labels, a colorblind-safe palette, responsive layouts, and a versioned local Plotly
runtime rather than a chart CDN or Python web server.

The visual system inherits the original portfolYOU page typography, dark/light theme,
spacing, and Bootstrap blue. Neutral surfaces and borders replace the former orange
and green research-dashboard treatment.

## Training recipe to explain

- Autoregressive next-token cross-entropy.
- MoE load-balancing and router z-loss auxiliary terms.
- AdamW, peak learning rate `3e-4`, minimum learning rate `3e-5`, weight decay `0.1`,
  betas `(0.9, 0.95)`, and gradient clipping at `1.0`.
- Linear warmup followed by cosine decay; bfloat16 mixed precision.
- Micro-batch 8 × accumulation 8 × context 1,024 = 65,536 tokens per optimizer step.
- 7,629 steps and 499,974,144 tokens per run.

## Headline interpretations

- Top-two MoE uses width-704 experts so active parameters match Modern within 0.1%;
  stored conditional capacity and routing/kernel overhead remain explicit trade-offs.
- ALiBI's relative distance bias and SWA's fixed receptive field transferred more
  cleanly beyond the 1K training length, for different reasons: 4K tail perplexity
  was 74.35 ± 1.14 for ALiBI and 75.09 ± 0.31 for SWA.
- Linear attention removed the explicit quadratic matrix but introduced fixed-state
  compression and an implementation path that did not realize the theoretical speedup.
- Every recipe produced reusable cache state. Vanilla led the narrow cached-generation
  slice at 512.8 tokens/s; SWA led 4K prefill at 204.9K tokens/s.

## Engineering choices

- Registry-driven model construction.
- Streaming FineWeb-Edu preparation and memory-mapped binary shards.
- Fixed-token, fixed-wall-clock, and fixed-FLOP comparison axes.
- Five seeds with individual values, sample standard deviation, and two-sided 95%
  Student-t confidence intervals.
- Explicit unsupported states rather than fabricated measurements.
- Atomic asynchronous checkpoints, integrity verification, and exact-state recovery.
- Frontend-agnostic JSON and interactive Plotly export separated from Jekyll presentation.

## Required limitations

- MoE active parameters are matched, but stored parameters remain larger and must not
  be described as equal checkpoint capacity.
- Training-history comparisons use all five seeds, while serving timing uses one
  representative checkpoint per recipe and is reported separately from seed uncertainty.
- Generation timing uses one representative checkpoint per recipe.
- Long-context evaluation is extrapolation beyond the 1K training context.
- SWA stability does not demonstrate retrieval across 4K tokens.
- Causal linear attention has no conventional pairwise softmax heatmap.
- Five seeds improve uncertainty estimates but do not establish transfer across
  corpora, parameter scales, implementations, or accelerators.

## Card and identity

Card tags: `Transformers`, `PyTorch`, `CUDA`, `FlashAttention`, `FineWeb-Edu`, `Jekyll`.
Use a custom static thumbnail. Place a small, accessible GitHub icon on the card and a
prominent source action in the shared case-study footer. Retain portfolio typography
and navigation with page-scoped styles. Use first-person voice for implementation
ownership and neutral scientific language for experimental claims.

## Implementation map

- `_layouts/transformer-case-study.html` owns the shared assets and shell.
- `_includes/transformer-variants/series-header.html` and `series-footer.html` own the
  repeated five-chapter navigation and provenance.
- `_includes/transformer-variants/chapters/` contains one narrative include per route.
- `pages/transformer-variants-*.html` defines the four subchapter routes; the project
  collection item defines Overview.
- `projects.html` and `_includes/project-index-local.html` intentionally avoid the
  remote theme's colliding `pages/projects.html` source path.

## Confirmed public test seams

1. Rendered Jekyll Projects card and case-study output.
2. Frozen visualization data transformed by local JavaScript.

Original review baseline: `9807cc4246e08830bbb8f7c320b64e43f976da71`.
