export const CASE_STUDY_ASSET_VERSION = "reader-first-v2";

export const caseStudyAssets = {
  summary: "/assets/data/transformer-variants/summary.json",
  internals: "/assets/data/transformer-variants/model_internals.json",
  retrieval: "/assets/data/transformer-variants/retrieval.json",
  routing: "/assets/data/transformer-variants/moe_routing.json",
  attentionIndex:
    "/assets/data/transformer-variants/attention/attention_patterns.json",
  attentionBase: "/assets/data/transformer-variants/attention/",
} as const;
