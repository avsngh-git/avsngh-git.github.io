import { useEffect } from "react";

import { CASE_STUDY_ASSET_VERSION } from "./config";

function loadScript(id: string, source: string, type?: "module") {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing?.dataset.loaded === "true") return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const script = existing ?? document.createElement("script");
    script.id = id;
    script.src = source;
    if (type) script.type = type;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => reject(new Error(`Unable to load ${source}`)),
      { once: true },
    );
    if (!existing) document.head.append(script);
  });
}

export function CaseStudyRuntime() {
  useEffect(() => {
    let active = true;
    const start = async () => {
      await loadScript(
        "portfolio-plotly-runtime",
        `/assets/js/plotly.min.js?v=${CASE_STUDY_ASSET_VERSION}`,
      );
      if (!active) return;
      await loadScript(
        "portfolio-case-study-runtime",
        `/assets/js/transformer-case-study.mjs?v=${CASE_STUDY_ASSET_VERSION}`,
        "module",
      );
    };

    void start().catch((error: unknown) => {
      const root = document.querySelector("#transformer-case-study");
      const message =
        error instanceof Error ? error.message : "Unknown visualization error.";
      root?.querySelectorAll(".tvc-loading").forEach((loading) => {
        loading.textContent = `Interactive data could not be loaded: ${message}`;
      });
    });

    return () => {
      active = false;
    };
  }, []);

  return null;
}
