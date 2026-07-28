import { expect, test } from "@playwright/test";

test("homepage renders real content without loading case-study assets", async ({
  page,
}) => {
  const caseStudyRequests: string[] = [];
  page.on("request", (request) => {
    if (
      request.url().includes("plotly") ||
      request.url().includes("/assets/data/transformer-variants/")
    ) {
      caseStudyRequests.push(request.url());
    }
  });

  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "Avinash Singh" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Selected Projects" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contact" })).toBeVisible();
  await expect(page.locator("form")).toHaveCount(0);
  expect(caseStudyRequests).toEqual([]);
});

test("theme and mobile navigation remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.getByRole("button", { name: "Open navigation menu" }).click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", {
      name: "Projects",
    }),
  ).toBeVisible();
});

test("case-study route initializes frozen interactive evidence", async ({ page }) => {
  await page.goto("/projects/transformer-variants/");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Transformer Variants: which efficiency claims/i,
    }),
  ).toBeVisible();
  await expect(page.getByRole("tab")).toHaveCount(10);
  await page.getByRole("tab", { name: /02 Modern/ }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "current dense Transformer stack",
  );
  await expect(page.locator("#fixed-data-chart.js-plotly-plot")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator("#attention-chart.js-plotly-plot")).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.locator("#variant-comparison tbody tr")).toHaveCount(10);
  await expect(page.getByText(/Interactive data could not be loaded/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: "View source repository" })).toHaveAttribute(
    "href",
    /github\.com\/avsngh-git\/TransformerVariants\/commit\//,
  );
});

test("case-study controls update every interactive evidence view", async ({
  page,
}) => {
  await page.goto("/projects/transformer-variants/");
  await expect(page.locator("#variant-comparison tbody tr")).toHaveCount(10, {
    timeout: 20_000,
  });

  await expect(page.locator("#learning-story [data-story='title']")).toContainText(
    "Mixture of Experts",
  );
  const wallClock = page.getByRole("button", { name: /Wall-clock/ });
  await wallClock.click();
  await expect(wallClock).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator("#learning-curves-chart-accessible-data-summary"),
  ).toContainText("Elapsed training seconds");
  await expect(page.locator("#learning-story [data-story='title']")).toContainText(
    "Modern leads",
  );
  await expect(page.locator("#learning-story [data-story='graph']")).toContainText(
    "hours",
  );
  await expect(page.locator("#learning-story [data-story='groups']")).toContainText(
    "Interleaved and deep Mixture of Experts are again nearly identical",
  );

  await expect(page.locator("#throughput-explanation-title")).toHaveText(
    "Grouped-Query Attention led; Mixture of Experts trailed",
  );
  await expect(page.locator("#throughput-explanation-graph")).toContainText(
    "forward pass, backward pass, and optimizer update",
  );
  await expect(page.locator("#throughput-explanation-compromise")).toContainText(
    "Mixture of Experts was slowest",
  );
  await expect(page.locator("#throughput-explanation-groups")).toContainText(
    "two partial expert recipes form another tight pair",
  );

  const cachedDecode = page.getByRole("button", {
    name: /KV-cached decode/,
  });
  await cachedDecode.click();
  await expect(cachedDecode).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.locator("#throughput-chart-accessible-data-summary"),
  ).toContainText("cachedDecodeTokensPerSecond");
  await expect(page.locator("#throughput-explanation-title")).toHaveText(
    "Vanilla led; Mixture of Experts trailed",
  );
  await expect(page.locator("#throughput-explanation-graph")).toContainText(
    "prompt prefill happens before the timer",
  );
  await expect(page.locator("#throughput-explanation-compromise")).toContainText(
    "Mixture of Experts decodes at 96.2 tokens/s",
  );
  await expect(page.locator("#throughput-explanation-groups")).toContainText(
    "identical expert-layer count produces the dominant similarity",
  );

  await page.getByRole("button", { name: "4K prompt prefill" }).click();
  await expect(page.locator("#throughput-explanation-title")).toHaveText(
    "Sliding-Window Attention led; Causal linear trailed",
  );
  await expect(page.locator("#throughput-explanation-graph")).toContainText(
    "Vanilla is absent—not zero",
  );
  await expect(page.locator("#throughput-explanation-compromise")).toContainText(
    "no exact distant retrieval",
  );
  await expect(page.locator("#throughput-explanation-groups")).toContainText(
    "three expert recipes cluster just below it",
  );

  await expect(page.locator("#context-story [data-story='title']")).toContainText(
    "remain stable at 4K",
  );
  await page.locator("#context-metric").selectOption("prefillTokensPerSecond");
  await expect(page.locator("#context-chart-accessible-data-summary")).toContainText(
    "prefillTokensPerSecond",
  );
  await expect(page.locator("#context-story [data-story='title']")).toContainText(
    "fastest 4K prefill",
  );
  await expect(page.locator("#context-story [data-story='groups']")).toContainText(
    "Modern and all three expert recipes cluster much lower",
  );

  await expect(page.locator("#retrieval-story [data-story='title']")).toContainText(
    "Passkey retrieval",
  );
  await page.locator("#retrieval-task").selectOption("needle");
  await page
    .locator("#retrieval-configuration")
    .selectOption("rope_theta_100000");
  await page.locator("#retrieval-distance").selectOption("far");
  await expect(
    page.locator("#retrieval-chart-accessible-data-summary"),
  ).toContainText(
    "Answer-evidence lift heatmap for rope_theta_100000, needle, and far distance",
  );
  await expect(page.locator("#retrieval-score-description")).toContainText(
    "Positive values mean the planted fact increased",
  );
  await expect(page.locator("#retrieval-story [data-story='title']")).toHaveText(
    "Needle-in-a-haystack · RoPE base 100,000 · farthest fact",
  );
  await expect(page.locator("#retrieval-story [data-story='graph']")).toContainText(
    "selected cells",
  );
  await expect(page.locator("#retrieval-story [data-story='tradeoff']")).toContainText(
    "longest gap",
  );
  await expect(page.locator("#retrieval-story [data-story='groups']")).toContainText(
    "complete ranking",
  );
  await expect(page.locator("#retrieval-story [data-story='groups']")).toContainText(
    "Mixture of Experts",
  );

  await page.locator("#routing-variant").selectOption("moe_deep");
  await expect(page.locator("#routing-status")).toContainText(
    "Deep Mixture of Experts",
  );
  const lastLayer = await page
    .locator("#routing-layer option")
    .last()
    .getAttribute("value");
  expect(lastLayer).not.toBeNull();
  await page.locator("#routing-layer").selectOption(lastLayer!);
  await expect(page.locator("#routing-status")).toContainText(`layer ${lastLayer}`);
  await expect(page.locator("#routing-story [data-story='title']")).toContainText(
    `Deep Mixture of Experts uses its pool at layer ${lastLayer}`,
  );
  await expect(page.locator("#routing-story [data-story='driver']")).toContainText(
    "normalized entropy",
  );
  await expect(page.locator("#routing-story [data-story='groups']")).toContainText(
    "Expert 0:",
  );

  await page.locator("#attention-variant").selectOption("alibi");
  await expect(page.locator("#attention-status")).toContainText(
    "ALiBI · layer",
  );
  const lastAttentionLayer = await page
    .locator("#attention-layer option")
    .last()
    .getAttribute("value");
  expect(lastAttentionLayer).not.toBeNull();
  await page.locator("#attention-layer").selectOption(lastAttentionLayer!);
  await expect(page.locator("#attention-status")).toContainText(
    `layer ${lastAttentionLayer}`,
  );
  await page.locator("#attention-head").selectOption("0");
  await expect(page.locator("#attention-status")).toContainText("head 0");
  await expect(page.locator("#attention-story [data-story='title']")).toHaveText(
    `ALiBI · layer ${lastAttentionLayer} · head 0`,
  );
  await expect(page.locator("#attention-story [data-story='graph']")).toContainText(
    "probability stays",
  );
  await expect(page.locator("#attention-story [data-story='groups']")).toContainText(
    "Head 0:",
  );
  await page.locator("#attention-variant").selectOption("linear");
  await expect(page.locator("#attention-status")).toContainText(
    "does not define a conventional pairwise softmax attention matrix",
  );
  await expect(page.locator("#attention-chart")).toBeHidden();
  await expect(page.locator("#attention-story [data-story='title']")).toHaveText(
    "Causal linear has no conventional pairwise attention map",
  );
  await expect(page.locator("#attention-story [data-story='groups']")).toContainText(
    "validation loss",
  );

  const recipeSort = page.getByRole("button", { name: /^Recipe/ });
  const firstRecipe = page.locator("#variant-comparison tbody tr").first().locator("td").first();
  const initialRecipe = await firstRecipe.textContent();
  await recipeSort.click();
  await expect(recipeSort.locator("..")).toHaveAttribute("aria-sort", "ascending");
  await expect(firstRecipe).not.toHaveText(initialRecipe ?? "");
  await recipeSort.click();
  await expect(recipeSort.locator("..")).toHaveAttribute("aria-sort", "descending");
});

test("retrieval explanation follows the negative-log-likelihood fallback", async ({
  page,
}) => {
  await page.route("**/retrieval.json*", async (route) => {
    const response = await route.fetch();
    const retrieval = await response.json();
    retrieval.schema_version = 1;
    await route.fulfill({ response, json: retrieval });
  });
  await page.goto("/projects/transformer-variants/");
  await expect(page.locator("#retrieval-score-description")).toContainText(
    "lower values indicate greater confidence",
  );
  await expect(page.locator("#retrieval-story [data-story='graph']")).toContainText(
    "negative log-likelihood",
  );
  await expect(page.locator("#retrieval-story [data-story='driver']")).toContainText(
    "lowest negative log-likelihood",
  );
});

test("attention explanation ignores a stale asset response", async ({ page }) => {
  await page.route("**/attention_patterns_modern.json*", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    await route.continue();
  });
  await page.goto("/projects/transformer-variants/");
  await page.locator("#attention-variant").selectOption("alibi");
  await expect(page.locator("#attention-status")).toContainText("ALiBI · layer", {
    timeout: 20_000,
  });
  await expect(page.locator("#attention-story [data-story='title']")).toContainText(
    "ALiBI · layer",
  );
  await expect(page.locator("#attention-story [data-story='title']")).not.toContainText(
    "Modern",
  );
});

test("attention asset failure replaces stale controls and explanation", async ({
  page,
}) => {
  await page.route("**/attention_patterns_alibi.json*", (route) => route.abort());
  await page.goto("/projects/transformer-variants/");
  await expect(page.locator("#attention-status")).toContainText("Modern · layer", {
    timeout: 20_000,
  });
  await page.locator("#attention-variant").selectOption("alibi");
  await expect(page.locator("#attention-story [data-story='title']")).toHaveText(
    "Could not load ALiBI attention",
  );
  await expect(page.locator("#attention-story [data-story='graph']")).not.toBeEmpty();
  await expect(page.locator("#attention-layer")).toBeDisabled();
  await expect(page.locator("#attention-head")).toBeDisabled();
  await expect(page.locator("#attention-chart")).toBeHidden();
});

test("one failed data source does not invalidate independent stories", async ({
  page,
}) => {
  await page.route("**/moe_routing.json*", (route) => route.abort());
  await page.goto("/projects/transformer-variants/");
  await expect(page.locator("#routing-story [data-story='title']")).toHaveText(
    "The explanation could not be updated",
  );
  await expect(page.locator("#routing-variant")).toBeDisabled();
  await expect(page.locator("#learning-story [data-story='title']")).toContainText(
    "Mixture of Experts",
  );
  await expect(page.locator("#learning-story [data-story='title']")).not.toContainText(
    "could not be updated",
  );
});

test("empty retrieval selections replace the previous narrative", async ({ page }) => {
  await page.route("**/retrieval.json*", async (route) => {
    const response = await route.fetch();
    const retrieval = await response.json();
    retrieval.aggregate = {};
    await route.fulfill({ response, json: retrieval });
  });
  await page.goto("/projects/transformer-variants/");
  await expect(page.locator("#retrieval-story [data-story='graph']")).toContainText(
    "No recipe has a supported measurement",
  );
  await expect(page.locator("#retrieval-story [data-story='driver']")).toContainText(
    "not converted into zeros",
  );
});

test("no-JavaScript fallback hides unresolved story shells", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/projects/transformer-variants/");
  await expect(
    page.getByRole("heading", { name: "JavaScript is required to view this portfolio" }),
  ).toBeVisible();
  await expect(page.locator(".tvc-option-story")).toHaveCount(0);
  await context.close();
});

test("legacy chapter routes redirect to matching consolidated anchors", async ({
  page,
}) => {
  await page.goto("/projects/transformer-variants/results/");
  await expect(page).toHaveURL(
    /\/projects\/transformer-variants\/#results$/,
  );
  await expect(page.locator("#results")).toBeVisible();

  await page.goto("/projects/transformer-variants.html");
  await expect(page).toHaveURL(/\/projects\/transformer-variants\/$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /Transformer Variants: which efficiency claims/i,
    }),
  ).toBeVisible();
});
