const moduleUrl = new URL(import.meta.url);
const assetVersion = moduleUrl.searchParams.get("v") || "";
const helperUrl = new URL("./transformer-case-study-data.mjs", moduleUrl);
if (assetVersion) helperUrl.searchParams.set("v", assetVersion);

const {
  attentionAssetFor,
  buildComparisonRows,
  commonBudgetSnapshot,
  contextSeries,
  fillTemplate,
  metricSeries,
  summarizeAttentionWeights,
  summarizeRetrievalHeatmap,
  summarizeRoutingUtilization,
  throughputExtremes,
} = await import(helperUrl.href);

const root = document.querySelector("#transformer-case-study");
if (!root) throw new Error("Transformer Variants case-study root was not found.");
if (!window.Plotly) throw new Error("The local Plotly runtime was not loaded.");

const Plotly = window.Plotly;
const names = {
  alibi: "ALiBI", gqa: "Grouped-Query Attention", linear: "Causal linear",
  modern: "Modern", moe: "Mixture of Experts",
  moe_deep: "Deep Mixture of Experts",
  moe_interleaved: "Interleaved Mixture of Experts",
  swa: "Sliding-Window Attention",
  swa_interleaved: "Interleaved Sliding-Window Attention", vanilla: "Vanilla",
};
const shortNames = {
  ...names,
  gqa: "GQA",
  moe: "MoE",
  moe_deep: "MoE deep",
  moe_interleaved: "MoE interleaved",
  swa: "SWA",
  swa_interleaved: "SWA interleaved",
};
const colors = {
  alibi: "#0072B2", gqa: "#56B4E9", linear: "#4D4D4D", modern: "#009E73",
  moe: "#D55E00", moe_deep: "#E69F00", moe_interleaved: "#CC79A7",
  swa: "#6A5ACD", swa_interleaved: "#8A7FDB", vanilla: "#7F8C8D",
};
const compact = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 2,
});
const chartConfig = {
  displaylogo: false,
  responsive: true,
  scrollZoom: true,
  toImageButtonOptions: { format: "svg", filename: "transformer-variants" },
};

async function fetchJson(url) {
  const requestUrl = new URL(url, window.location.href);
  if (assetVersion) requestUrl.searchParams.set("v", assetVersion);
  const response = await fetch(requestUrl);
  if (!response.ok) {
    throw new Error("Could not load " + requestUrl.href + " (" + response.status + ").");
  }
  return response.json();
}

function readStoryContent(id) {
  const source = root.querySelector(`#${id}`);
  if (!source?.textContent) return {};
  return JSON.parse(source.textContent);
}

function storyKey(value) {
  return value.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

const storyFields = [
  "eyebrow", "title", "graph", "taskHeading", "task", "driverHeading", "driver",
  "tradeoffHeading", "tradeoff", "groupsHeading", "groups", "conclusion",
];

function storyView(content, overrides = {}) {
  return Object.fromEntries(storyFields.map((field) => [
    field,
    overrides[field] ?? content?.[field] ?? "",
  ]));
}

function updateOptionStory(panelId, story, values = {}) {
  const panel = root.querySelector(`#${panelId}`);
  if (!panel || !story) return;
  for (const element of panel.querySelectorAll("[data-story]")) {
    const text = story[storyKey(element.dataset.story)];
    element.textContent = typeof text === "string"
      ? fillTemplate(text, values)
      : "";
  }
}

function showStoryFailure(panelId, message) {
  const content = readStoryContent("story-failure-content");
  updateOptionStory(panelId, storyView(content), { message });
}

function failureText(field, message) {
  const content = readStoryContent("story-failure-content");
  return fillTemplate(content[field] || "[[message]]", { message });
}

function reportSetupFailure(error, {
  chartIds = [],
  storyIds = [],
  controlSelectors = [],
  statusId,
} = {}) {
  const message = error instanceof Error ? error.message : String(error);
  for (const id of chartIds) {
    const chart = root.querySelector(`#${id}`);
    const loading = chart?.querySelector(".tvc-loading");
    if (loading) loading.textContent = failureText("chart", message);
  }
  for (const id of storyIds) showStoryFailure(id, message);
  for (const selector of controlSelectors) {
    for (const control of root.querySelectorAll(selector)) {
      control.disabled = true;
    }
  }
  const status = statusId ? root.querySelector(`#${statusId}`) : null;
  if (status) status.textContent = failureText("status", message);
}

async function runSetup(setup, failureOptions) {
  try {
    await setup();
  } catch (error) {
    reportSetupFailure(error, failureOptions);
  }
}

function chartTheme(extra = {}) {
  const styles = getComputedStyle(root);
  const foreground = styles.color;
  const border = styles.getPropertyValue("--tvc-border").trim() || "rgba(127,127,127,.25)";
  return {
    autosize: true,
    paper_bgcolor: "rgba(0,0,0,0)",
    plot_bgcolor: "rgba(0,0,0,0)",
    font: { family: "Inter, system-ui, sans-serif", color: foreground, size: 13 },
    hoverlabel: { namelength: -1 },
    margin: { l: 72, r: 28, t: 42, b: 64 },
    legend: {
      orientation: "h", x: 0, xanchor: "left", y: 1.02, yanchor: "bottom",
      font: { size: 11 },
    },
    xaxis: { gridcolor: border, zerolinecolor: border, automargin: true },
    yaxis: { gridcolor: border, zerolinecolor: border, automargin: true },
    ...extra,
  };
}

function axisTitle(axis) {
  return typeof axis?.title === "string" ? axis.title : axis?.title?.text;
}

function updateChartData(container, traces, summaryText) {
  if (!container?.id || !container.parentElement) return;
  const id = container.id + "-accessible-data";
  let details = container.parentElement.querySelector(`#${id}`);
  if (!details) {
    details = document.createElement("details");
    details.id = id;
    details.className = "tvc-chart-data";
    container.after(details);
    container.setAttribute("aria-describedby", id + "-summary");
  }
  const description = document.createElement("p");
  description.id = id + "-summary";
  description.setAttribute("role", "status");
  description.setAttribute("aria-live", "polite");
  description.textContent = summaryText;
  const disclosure = document.createElement("summary");
  disclosure.textContent = "Accessible chart data";
  const table = document.createElement("table");
  const header = document.createElement("tr");
  for (const label of ["Series", "X", "Y", "Value"]) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = label;
    header.append(th);
  }
  const head = document.createElement("thead");
  head.append(header);
  const body = document.createElement("tbody");
  for (const [traceIndex, trace] of traces.entries()) {
    const series = trace.name || `Series ${traceIndex + 1}`;
    if (Array.isArray(trace.z)) {
      for (const [rowIndex, row] of trace.z.entries()) {
        for (const [columnIndex, value] of row.entries()) {
          const tr = document.createElement("tr");
          for (const item of [
            series,
            trace.x?.[columnIndex] ?? columnIndex,
            trace.y?.[rowIndex] ?? rowIndex,
            value,
          ]) tr.append(cell(String(item)));
          body.append(tr);
        }
      }
      continue;
    }
    const pointCount = Math.max(trace.x?.length || 0, trace.y?.length || 0);
    for (let index = 0; index < pointCount; index += 1) {
      const tr = document.createElement("tr");
      for (const item of [
        series,
        trace.x?.[index] ?? index,
        trace.y?.[index] ?? "",
        trace.error_y?.array?.[index] ?? trace.error_x?.array?.[index] ?? "",
      ]) tr.append(cell(String(item)));
      body.append(tr);
    }
  }
  table.append(head, body);
  details.replaceChildren(disclosure, description, table);
}

function renderPlot(container, traces, layout, accessibleSummary) {
  if (!container) return;
  if (!container.classList.contains("js-plotly-plot")) {
    container.replaceChildren();
  }
  Plotly.react(container, traces, chartTheme(layout), chartConfig);
  const xLabel = axisTitle(layout.xaxis) || "horizontal axis";
  const yLabel = axisTitle(layout.yaxis) || "vertical axis";
  updateChartData(
    container,
    traces,
    accessibleSummary ||
      `${traces.length} measured series. ${yLabel} plotted against ${xLabel}.`,
  );
}

function refreshPlotThemes() {
  const theme = chartTheme();
  for (const chart of root.querySelectorAll(".js-plotly-plot")) {
    Plotly.relayout(chart, {
      "font.color": theme.font.color,
      "xaxis.gridcolor": theme.xaxis.gridcolor,
      "xaxis.zerolinecolor": theme.xaxis.zerolinecolor,
      "yaxis.gridcolor": theme.yaxis.gridcolor,
      "yaxis.zerolinecolor": theme.yaxis.zerolinecolor,
    });
  }
}

new MutationObserver((records) => {
  if (records.some((record) => record.attributeName === "data-theme")) {
    refreshPlotThemes();
  }
}).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-theme"],
});

function comparisonValue(row, key) {
  const value = row[key];
  if (key === "variant") return names[value] || value;
  if (key === "fixedDataLoss") return value?.mean ?? null;
  if (key === "tailPerplexity4k") return value?.status === "ok" ? value.mean : null;
  return value;
}

function cell(content) {
  const td = document.createElement("td");
  if (content instanceof Node) td.append(content);
  else td.textContent = content;
  return td;
}

function badge(label, ok = false) {
  const span = document.createElement("span");
  span.className = "tvc-badge" + (ok ? " tvc-badge-ok" : "");
  span.textContent = label;
  return span;
}

function uncertainty(summary, digits = 4) {
  if (!summary || typeof summary.mean !== "number") return "Unsupported";
  const spread = typeof summary.ci95_half_width === "number"
    ? ` (95% CI ± ${summary.ci95_half_width.toFixed(digits)})`
    : typeof summary.std === "number" ? ` ± ${summary.std.toFixed(digits)}` : "";
  return summary.mean.toFixed(digits) + spread;
}

function renderComparisonTable(summary) {
  const table = root.querySelector("#variant-comparison");
  const body = table?.querySelector("tbody");
  if (!table || !body) return;
  const rows = buildComparisonRows(summary);
  let sort = { key: "fixedDataLoss", direction: 1 };

  const render = () => {
    const ordered = [...rows].sort((a, b) => {
      const left = comparisonValue(a, sort.key);
      const right = comparisonValue(b, sort.key);
      if (left == null && right == null) return 0;
      if (left == null) return 1;
      if (right == null) return -1;
      const delta = typeof left === "string"
        ? left.localeCompare(right)
        : Number(left) - Number(right);
      return delta * sort.direction;
    });
    body.replaceChildren(...ordered.map((row) => {
      const tr = document.createElement("tr");
      const tail = row.tailPerplexity4k?.status === "ok"
        ? uncertainty(row.tailPerplexity4k, 2)
        : badge("Unsupported");
      const generation = typeof row.cachedGenerationTokensPerSecond === "number"
        ? row.cachedGenerationTokensPerSecond.toFixed(2)
        : badge("Unsupported");
      tr.append(
        cell(names[row.variant] || row.variant),
        cell(uncertainty(row.fixedDataLoss)),
        cell((row.activeParameters / 1e6).toFixed(1) + "M"),
        cell((row.totalParameters / 1e6).toFixed(1) + "M"),
        cell(generation),
        cell(tail),
        cell(typeof row.prefillTokensPerSecond4k === "number"
          ? compact.format(row.prefillTokensPerSecond4k)
          : badge("Unsupported")),
        cell(badge(row.cacheStatus === "ok" ? "Supported" : "Unsupported",
          row.cacheStatus === "ok")),
      );
      return tr;
    }));
    for (const button of table.querySelectorAll("[data-sort]")) {
      const active = button.dataset.sort === sort.key;
      button.closest("th")?.setAttribute(
        "aria-sort",
        active ? (sort.direction === 1 ? "ascending" : "descending") : "none",
      );
      const clean = button.textContent.replace(/\s[▲▼]$/, "");
      button.textContent = active
        ? clean + " " + (sort.direction === 1 ? "▲" : "▼")
        : clean;
    }
  };
  for (const button of table.querySelectorAll("[data-sort]")) {
    button.addEventListener("click", () => {
      const key = button.dataset.sort;
      sort = { key, direction: sort.key === key ? sort.direction * -1 : 1 };
      render();
    });
  }
  render();
}

function renderFixedData(summary) {
  const container = root.querySelector("#fixed-data-chart");
  if (!container) return;
  const ordered = [...summary.variants].sort(
    (left, right) => left.fixedDataLoss.mean - right.fixedDataLoss.mean,
  );
  const categories = ordered.map(({ variant }) => shortNames[variant] || variant);
  const interval = ordered.map(({ fixedDataLoss }) =>
    fixedDataLoss.ci95_half_width ?? fixedDataLoss.std ?? 0);
  const aggregate = {
    type: "scatter",
    mode: "markers",
    name: "Five-seed mean",
    x: categories,
    y: ordered.map(({ fixedDataLoss }) => fixedDataLoss.mean),
    marker: {
      color: ordered.map(({ variant }) => colors[variant]),
      size: 12,
      line: { color: "#fff", width: 1 },
    },
    error_y: { type: "data", array: interval, visible: true, thickness: 1.5, width: 5 },
    customdata: ordered.map(({ fixedDataLoss }) => fixedDataLoss.n),
    hovertemplate: "%{x}<br>mean loss: %{y:.4f}<br>n=%{customdata}<extra></extra>",
  };
  const seedPoints = {
    type: "scatter",
    mode: "markers",
    name: "Individual seeds",
    x: ordered.flatMap(({ variant, seedLosses = [] }) =>
      seedLosses.map(() => shortNames[variant] || variant)),
    y: ordered.flatMap(({ seedLosses = [] }) => seedLosses.map(({ value }) => value)),
    customdata: ordered.flatMap(({ seedLosses = [] }) =>
      seedLosses.map(({ seed }) => seed)),
    marker: { color: "rgba(80,80,80,.45)", size: 6, symbol: "circle-open" },
    hovertemplate: "%{x}<br>seed %{customdata}<br>loss: %{y:.4f}<extra></extra>",
  };
  renderPlot(container, [seedPoints, aggregate], {
    showlegend: true,
    xaxis: { title: "Transformer recipe", tickangle: -28, automargin: true },
    yaxis: { title: "Validation cross-entropy (lower is better)", automargin: true },
    margin: { l: 72, r: 28, t: 56, b: 120 },
  });
}

const learningAxes = {
  tokens: {
    label: "Training tokens",
    scale: "log",
    formatBudget: (value) => compact.format(value),
  },
  wallclock: {
    label: "Elapsed training seconds",
    scale: "linear",
    formatBudget: (value) => `${(value / 3600).toFixed(2)} hours`,
  },
  flops: {
    label: "Estimated cumulative FLOPs",
    scale: "log",
    formatBudget: (value) => `${(value / 1e15).toFixed(2)} × 10^15 FLOPs`,
  },
};

function renderLearningCurves(summary, axis) {
  const container = root.querySelector("#learning-curves-chart");
  if (!container) return;
  const axisContent = learningAxes[axis] || learningAxes.tokens;
  const curves = summary.trainingCurves?.[axis] || {};
  const seedTraces = Object.entries(curves).flatMap(([variant, curve]) =>
    (curve.seeds || []).map((seed) => ({
      type: "scatter",
      mode: "lines",
      name: `${shortNames[variant] || variant} · seed ${seed.seed}`,
      legendgroup: variant,
      showlegend: false,
      x: seed.x,
      y: seed.y,
      line: { color: colors[variant], width: 1 },
      opacity: 0.22,
      hovertemplate: "%{fullData.name}<br>budget: %{x:.4s}<br>loss: %{y:.4f}" +
        "<extra></extra>",
    })));
  const aggregateTraces = Object.entries(curves).map(([variant, curve]) => ({
    type: "scatter",
    mode: "lines+markers",
    name: shortNames[variant] || variant,
    legendgroup: variant,
    x: curve.x,
    y: curve.mean,
    line: { color: colors[variant], width: 2.5 },
    marker: { color: colors[variant], size: 6 },
    error_y: {
      type: "data",
      array: curve.std.map((value) => value ?? 0),
      visible: true,
      thickness: 0.8,
      width: 0,
      color: colors[variant],
    },
    customdata: curve.mean.map(() => curve.n),
    hovertemplate: "%{fullData.name} mean<br>budget: %{x:.4s}<br>loss: %{y:.4f}" +
      "<br>n=%{customdata}<extra></extra>",
  }));
  const traces = [...seedTraces, ...aggregateTraces];
  renderPlot(container, traces, {
    xaxis: {
      title: axisContent.label,
      type: axisContent.scale,
      automargin: true,
    },
    yaxis: { title: "Validation cross-entropy (lower is better)", automargin: true },
    hovermode: "closest",
  });
}

function formatLearningBudget(axis, value) {
  return (learningAxes[axis] || learningAxes.tokens).formatBudget(value);
}

function updateLearningStory(summary, axis) {
  const story = readStoryContent("learning-story-content")[axis];
  if (!story) return;
  const snapshot = commonBudgetSnapshot(summary, axis);
  updateOptionStory("learning-story", story, {
    budget: formatLearningBudget(axis, snapshot.budget),
    leader: names[snapshot.leader.variant] || snapshot.leader.variant,
    leaderLoss: snapshot.leader.loss.toFixed(4),
    laggard: names[snapshot.laggard.variant] || snapshot.laggard.variant,
    laggardLoss: snapshot.laggard.loss.toFixed(4),
  });
}

function setupLearningTabs(summary) {
  const buttons = [...root.querySelectorAll("[data-learning-axis]")];
  if (!buttons.length) return;
  const select = (axis) => {
    for (const candidate of buttons) {
      const active = candidate.dataset.learningAxis === axis;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-pressed", String(active));
    }
    renderLearningCurves(summary, axis);
    updateLearningStory(summary, axis);
  };
  for (const button of buttons) {
    button.addEventListener("click", () => select(button.dataset.learningAxis));
  }
  select(buttons.find((button) => button.classList.contains("is-active"))
    ?.dataset.learningAxis || "tokens");
}

function renderPareto(summary) {
  const container = root.querySelector("#pareto-chart");
  if (!container) return;
  const available = summary.variants.filter(
    (variant) => typeof variant.trainingFlops === "number",
  );
  const frontier = new Set(summary.paretoFront || []);
  const traces = [
    {
      type: "scatter",
      mode: "markers+text",
      name: "Measured recipe",
      x: available.map(({ trainingFlops }) => trainingFlops),
      y: available.map(({ fixedDataLoss }) => fixedDataLoss.mean),
      text: available.map(({ variant }) => shortNames[variant] || variant),
      textposition: "top center",
      customdata: available.map(({ variant, activeParameters, totalParameters }) => [
        shortNames[variant] || variant,
        activeParameters,
        totalParameters,
      ]),
      marker: {
        color: available.map(({ variant }) => colors[variant]),
        size: available.map(({ variant }) => frontier.has(variant) ? 17 : 11),
        symbol: available.map(({ variant }) => frontier.has(variant) ? "diamond" : "circle"),
        line: { color: "#fff", width: 1 },
      },
      hovertemplate: "%{customdata[0]}<br>FLOPs: %{x:.4s}<br>loss: %{y:.4f}" +
        "<br>active params: %{customdata[1]:.4s}<br>stored params: %{customdata[2]:.4s}" +
        "<extra></extra>",
    },
  ];
  renderPlot(container, traces, {
    showlegend: false,
    xaxis: { title: "Estimated cumulative training FLOPs", type: "log", automargin: true },
    yaxis: { title: "Final validation loss (lower is better)", automargin: true },
    margin: { l: 72, r: 30, t: 42, b: 72 },
  });
}

function renderThroughput(summary, metric) {
  const container = root.querySelector("#throughput-chart");
  if (!container) return;
  const series = metricSeries(summary, metric).sort((a, b) => a.value - b.value);
  const byVariant = Object.fromEntries(
    summary.variants.map((variant) => [variant.variant, variant]),
  );
  const training = metric === "trainingTokensPerSecond";
  renderPlot(container, [{
    type: "bar",
    orientation: "h",
    x: series.map(({ value }) => value),
    y: series.map(({ variant }) => shortNames[variant] || variant),
    error_x: training ? {
      type: "data",
      array: series.map(({ variant }) =>
        byVariant[variant]?.trainingThroughput?.std ?? 0),
      visible: true,
      thickness: 1,
      width: 4,
    } : undefined,
    marker: { color: series.map(({ variant }) => colors[variant]) },
    customdata: series.map(({ variant }) => [
      shortNames[variant] || variant,
      byVariant[variant]?.trainingThroughput?.std ?? null,
    ]),
    hovertemplate: training
      ? "%{customdata[0]}<br>%{x:,.2f} tokens/s" +
        "<br>seed SD: %{customdata[1]:,.2f}<extra></extra>"
      : "%{customdata[0]}<br>%{x:,.2f} tokens/s<extra></extra>",
  }], {
    showlegend: false,
    xaxis: { title: "Measured tokens per second (higher is better)", automargin: true },
    yaxis: { automargin: true },
    margin: { l: 145, r: 28, t: 28, b: 65 },
  }, `${series.length} recipes ranked for ${metric}. ` +
    "The table lists every measured value and seed-level error where available.");
}

function formatRate(value) {
  return `${compact.format(value)} tokens/s`;
}

function updateThroughputExplanation(summary, metric) {
  const explanation = readStoryContent("throughput-explanation-content")[metric];
  const panel = root.querySelector("#throughput-explanation");
  if (!explanation || !panel) return;
  const extremes = throughputExtremes(summary, metric);
  const templateValues = {
    measuredCount: String(extremes.measuredCount),
    leader: names[extremes.leader.variant],
    leaderRate: formatRate(extremes.leader.value),
    ratio: extremes.ratio.toFixed(1),
    laggard: names[extremes.laggard.variant],
    laggardRate: formatRate(extremes.laggard.value),
  };
  const setText = (selector, text) => {
    const element = panel.querySelector(selector);
    if (element) element.textContent = text;
  };
  setText("#throughput-explanation-workload", explanation.workload);
  setText(
    "#throughput-explanation-title",
    `${names[extremes.leader.variant]} led; ${names[extremes.laggard.variant]} trailed`,
  );
  setText(
    "#throughput-explanation-graph",
    fillTemplate(explanation.graph, templateValues),
  );
  setText(
    "#throughput-explanation-leader-heading",
    `Why ${names[extremes.leader.variant]} performed well`,
  );
  setText("#throughput-explanation-leader", explanation.leader);
  setText(
    "#throughput-explanation-laggard-heading",
    `Why ${names[extremes.laggard.variant]} performed poorly`,
  );
  setText("#throughput-explanation-laggard", explanation.laggard);
  setText("#throughput-explanation-groups", explanation.groups);
  setText(
    "#throughput-explanation-compromise",
    `The compromise: ${explanation.compromise}`,
  );
}

function setupThroughput(summary) {
  const buttons = [...root.querySelectorAll("[data-throughput-metric]")];
  if (!buttons.length) return;
  const select = (metric) => {
    for (const candidate of buttons) {
      const active = candidate.dataset.throughputMetric === metric;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-pressed", String(active));
    }
    renderThroughput(summary, metric);
    updateThroughputExplanation(summary, metric);
  };
  for (const button of buttons) {
    button.addEventListener("click", () => select(button.dataset.throughputMetric));
  }
  select(buttons.find((button) => button.classList.contains("is-active"))
    ?.dataset.throughputMetric || "trainingTokensPerSecond");
}

function renderContextChart(summary, metric) {
  const container = root.querySelector("#context-chart");
  if (!container) return;
  const traces = contextSeries(summary, metric).flatMap(({ variant, points }) => {
    const available = points.filter(
      (point) => point.status === "ok" && typeof point.mean === "number",
    );
    if (!available.length) return [];
    return [{
      type: "scatter",
      mode: "lines+markers",
      name: shortNames[variant] || variant,
      x: available.map(({ context }) => context),
      y: available.map(({ mean }) => mean),
      error_y: {
        type: "data",
        array: available.map(({ std }) => std ?? 0),
        visible: true,
        thickness: 1,
        width: 4,
      },
      line: { color: colors[variant], width: 2 },
      marker: { color: colors[variant], size: 7 },
      customdata: available.map(({ n }) => n),
      hovertemplate: "%{fullData.name}<br>context: %{x:,} tokens<br>mean: %{y:,.2f}" +
        "<br>n=%{customdata}<extra></extra>",
    }];
  });
  const perplexity = metric === "tailPerplexity";
  renderPlot(container, traces, {
    xaxis: {
      title: "Context length (tokens)",
      tickvals: [1024, 2048, 4096],
      ticktext: ["1K", "2K", "4K"],
      automargin: true,
    },
    yaxis: {
      title: perplexity
        ? "Tail perplexity (lower is better)"
        : "Prefill tokens/s (higher is better)",
      type: perplexity ? "log" : "linear",
      automargin: true,
    },
    hovermode: "closest",
  }, `${traces.length} supported recipes shown for ${metric}. ` +
    "Unsupported context lengths are omitted from the plot, not converted to zero.");
}

function updateContextStory(metric) {
  const story = readStoryContent("context-story-content")[metric];
  updateOptionStory("context-story", story);
}

function setupContext(summary) {
  const select = root.querySelector("#context-metric");
  const render = () => {
    const metric = select?.value || "tailPerplexity";
    renderContextChart(summary, metric);
    updateContextStory(metric);
  };
  select?.addEventListener("change", render);
  render();
}

function retrievalConfiguration(variant, variantPayload, configuration) {
  if (["alibi", "vanilla"].includes(variant)) {
    return variantPayload?.native_position_encoding || null;
  }
  return variantPayload?.[configuration] || null;
}

function retrievalEstimate(payload, metric, distanceBucket) {
  if (distanceBucket === "aggregate") {
    return { summary: payload?.[metric], distance: "all tested distances" };
  }
  const distances = Object.entries(payload?.by_distance || {})
    .sort(([left], [right]) => Number(left) - Number(right));
  if (!distances.length) return { summary: null, distance: "unavailable" };
  const index = {
    near: 0,
    middle: Math.floor((distances.length - 1) / 2),
    far: distances.length - 1,
  }[distanceBucket];
  const [distance, measurements] = distances[index];
  return { summary: measurements?.[metric], distance: `${Number(distance)} tokens` };
}

function retrievalHeatmapRows(
  retrieval,
  task,
  metric,
  configuration,
  distanceBucket,
) {
  const contexts = retrieval.settings?.context_lengths || [];
  const rows = Object.entries(retrieval.aggregate || {}).flatMap(
    ([variant, configurations]) => {
      const points = retrievalConfiguration(
        variant,
        configurations,
        configuration,
      )?.[task] || {};
      const cells = contexts.map((context) => {
        const payload = points[String(context)];
        const estimate = retrievalEstimate(payload, metric, distanceBucket);
        const supported = ["ok", "partial"].includes(payload?.status)
          && typeof estimate.summary?.mean === "number";
        return supported
          ? {
            mean: estimate.summary.mean,
            std: estimate.summary.std,
            n: estimate.summary.n,
            distance: estimate.distance,
            ci95Low: estimate.summary.ci95_low,
            ci95High: estimate.summary.ci95_high,
          }
          : null;
      });
      return cells.some(Boolean) ? [{ variant, cells }] : [];
    },
  );
  return { contexts, rows };
}

function formatSigned(value) {
  return `${value >= 0 ? "+" : ""}${value.toFixed(3)}`;
}

function updateRetrievalStory(
  task,
  configuration,
  distanceBucket,
  contexts,
  rows,
  evidenceAvailable,
) {
  const content = readStoryContent("retrieval-story-content");
  const summary = summarizeRetrievalHeatmap(rows, contexts);
  const taskContent = content.tasks?.[task];
  const configurationContent = content.configurations?.[configuration];
  const distanceContent = content.distances?.[distanceBucket];
  if (!taskContent || !configurationContent || !distanceContent) return;
  const commonValues = {
    taskLabel: taskContent.label,
    configurationLabel: configurationContent.label,
    distanceLabel: distanceContent.label,
  };
  if (!summary) {
    updateOptionStory("retrieval-story", storyView(content, {
      eyebrow: taskContent.label,
      graph: content.empty?.graph,
      task: taskContent.meaning,
      driverHeading: content.empty?.driverHeading,
      driver: content.empty?.driver,
      tradeoff: `${configurationContent.meaning} ${distanceContent.meaning}`,
      groupsHeading: content.empty?.groupsHeading,
      groups: content.empty?.groups,
      conclusion: content.empty?.conclusion,
    }), commonValues);
    return;
  }
  const metricContent = evidenceAvailable ? content : content.fallback;
  const best = evidenceAvailable ? summary.strongest : summary.weakest;
  const worst = evidenceAvailable ? summary.weakest : summary.strongest;
  const formatMetric = evidenceAvailable
    ? formatSigned
    : (value) => value.toFixed(3);
  const ranking = [...summary.byVariant]
    .sort((left, right) => evidenceAvailable
      ? right.mean - left.mean
      : left.mean - right.mean);
  updateOptionStory("retrieval-story", storyView(content, {
    eyebrow: taskContent.label,
    title: content.title,
    graph: metricContent.graph,
    task: taskContent.meaning,
    driverHeading: metricContent.driverHeading,
    driver: metricContent.driver,
    tradeoff: `${configurationContent.meaning} ${distanceContent.meaning}`,
    groupsHeading: metricContent.groupsHeading,
    groups: metricContent.groups,
    conclusion: metricContent.conclusion,
  }), {
    ...commonValues,
    mean: formatMetric(summary.mean),
    positiveCount: String(summary.positiveCount),
    measuredCount: String(summary.measuredCount),
    best: names[best.variant] || best.variant,
    bestContext: compact.format(best.context),
    bestMean: formatMetric(best.mean),
    worst: names[worst.variant] || worst.variant,
    worstContext: compact.format(worst.context),
    worstMean: formatMetric(worst.mean),
    variantRanking: ranking
      .map(({ variant, mean }) =>
        `${names[variant] || variant} ${formatMetric(mean)}`)
      .join("; "),
  });
}

function renderRetrieval(retrieval, task, configuration, distanceBucket) {
  const container = root.querySelector("#retrieval-chart");
  if (!container) return;
  let evidenceAvailable = Number(retrieval.schema_version) >= 2;
  let metric = evidenceAvailable
    ? "mean_answer_evidence"
    : "mean_negative_log_likelihood";
  let heatmap = retrievalHeatmapRows(
    retrieval,
    task,
    metric,
    configuration,
    distanceBucket,
  );
  if (evidenceAvailable && !heatmap.rows.length) {
    evidenceAvailable = false;
    metric = "mean_negative_log_likelihood";
    heatmap = retrievalHeatmapRows(
      retrieval,
      task,
      metric,
      configuration,
      distanceBucket,
    );
  }
  const { contexts, rows } = heatmap;
  const labels = evidenceAvailable
    ? {
      short: "Answer-evidence lift",
      colorbar: "Δ log p",
      description: "Answer-evidence lift over a length-matched fact-removed control. " +
        "Positive values mean the planted fact increased the correct answer’s probability.",
    }
    : {
      short: "Answer-token NLL",
      colorbar: "NLL",
      description: "Answer-token negative log-likelihood: lower values indicate greater " +
        "confidence, but do not prove that the fact was retrieved.",
    };
  const traces = rows.length ? [{
    type: "heatmap",
    name: labels.short,
    x: contexts,
    y: rows.map(({ variant }) => names[variant] || variant),
    z: rows.map(({ cells }) => cells.map((cell) => cell?.mean ?? null)),
    customdata: rows.map(({ variant, cells }) => cells.map((cell) => [
      names[variant] || variant,
      cell?.std ?? null,
      cell?.n ?? null,
      cell?.distance ?? "unsupported",
      cell?.ci95Low ?? null,
      cell?.ci95High ?? null,
    ])),
    colorscale: evidenceAvailable
      ? [[0, "#0072B2"], [0.5, "#F4F0FC"], [1, "#D55E00"]]
      : [[0, "#F4F0FC"], [0.5, "#A982FF"], [1, "#3F157C"]],
    zmid: evidenceAvailable ? 0 : undefined,
    xgap: 3,
    ygap: 3,
    colorbar: { title: labels.colorbar },
    hovertemplate: "<b>%{customdata[0]}</b><br>context: %{x:,} tokens" +
      "<br>mean: %{z:.4f}<br>seed SD: %{customdata[1]:.4f}" +
      "<br>95% CI: [%{customdata[4]:.4f}, %{customdata[5]:.4f}]" +
      "<br>distance: %{customdata[3]}<br>n=%{customdata[2]}<extra></extra>",
  }] : [];
  const description = root.querySelector("#retrieval-score-description");
  if (description) description.textContent = labels.description;
  renderPlot(container, traces, {
    xaxis: {
      title: "Context length (tokens)",
      tickvals: contexts,
      automargin: true,
    },
    yaxis: {
      title: "Transformer recipe",
      autorange: "reversed",
      automargin: true,
    },
    margin: { l: 190, r: 70, t: 30, b: 64 },
    annotations: traces.length ? [] : [{
      text: "No supported measurements for this exact configuration",
      showarrow: false,
      x: 0.5,
      y: 0.5,
      xref: "paper",
      yref: "paper",
    }],
  }, traces.length
    ? `${rows.length} recipes shown in the ${labels.short} heatmap for ${configuration}, ` +
      `${task}, and ${distanceBucket} distance.`
    : `No recipe has a supported ${labels.short} measurement for ${configuration}, ` +
      `${task}, and ${distanceBucket} distance.`);
  updateRetrievalStory(
    task,
    configuration,
    distanceBucket,
    contexts,
    rows,
    evidenceAvailable,
  );
}

async function setupRetrieval() {
  const chart = root.querySelector("#retrieval-chart");
  const taskSelect = root.querySelector("#retrieval-task");
  const configurationSelect = root.querySelector("#retrieval-configuration");
  const distanceSelect = root.querySelector("#retrieval-distance");
  if (!chart || !taskSelect || !configurationSelect || !distanceSelect) {
    return;
  }
  const retrieval = await fetchJson(root.dataset.retrievalUrl);
  const render = () => renderRetrieval(
    retrieval,
    taskSelect.value,
    configurationSelect.value,
    distanceSelect.value,
  );
  taskSelect.addEventListener("change", render);
  configurationSelect.addEventListener("change", render);
  distanceSelect.addEventListener("change", render);
  render();
}

function renderInternals(internals, metric, field, containerId, yTitle) {
  const container = root.querySelector(containerId);
  if (!container) return;
  const traces = Object.entries(internals.variants || {}).flatMap(([variant, payload]) => {
    const values = payload?.[metric]?.[field];
    if (!Array.isArray(values) || !values.length) return [];
    const standardDeviation = payload?.[metric]?.[field + "_std"];
    return [{
      type: "scatter",
      mode: "lines+markers",
      name: shortNames[variant] || variant,
      x: values.map((_, index) => index),
      y: values,
      line: { color: colors[variant], width: 2 },
      marker: { color: colors[variant], size: 6 },
      error_y: Array.isArray(standardDeviation)
        ? { type: "data", array: standardDeviation, visible: true, width: 0 }
        : undefined,
      hovertemplate: "%{fullData.name}<br>depth: %{x}<br>value: %{y:.4f}<extra></extra>",
    }];
  });
  renderPlot(container, traces, {
    xaxis: {
      title: metric === "cka" ? "Adjacent layer pair" : "Layer",
      dtick: 1,
      automargin: true,
    },
    yaxis: { title: yTitle, automargin: true },
    hovermode: "closest",
  });
}

async function setupInternals() {
  if (!root.querySelector("#stable-rank-chart, #cka-chart")) return;
  const internals = await fetchJson(root.dataset.internalsUrl);
  renderInternals(
    internals,
    "stable_rank",
    "per_layer",
    "#stable-rank-chart",
    "Stable rank",
  );
  renderInternals(
    internals,
    "cka",
    "adjacent_curve",
    "#cka-chart",
    "Linear CKA",
  );
}

function meanAndStd(values) {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const std = values.length > 1
    ? Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0)
      / (values.length - 1))
    : 0;
  return { mean, std };
}

function formatPercent(value) {
  return `${(value * 100).toFixed(1)}%`;
}

function updateRoutingStory(variant, layer, seedCount, utilization) {
  const content = readStoryContent("routing-story-content");
  const variantContent = content.variants?.[variant];
  if (!variantContent || !utilization) return;
  updateOptionStory("routing-story", {
    eyebrow: `${names[variant] || variant} · layer ${layer}`,
    title: variantContent.title,
    graph: content.graph,
    driverHeading: content.driverHeading,
    driver: content.driver,
    tradeoffHeading: content.tradeoffHeading,
    tradeoff: variantContent.tradeoff,
    groupsHeading: content.groupsHeading,
    groups: content.groups,
    conclusion: content.conclusion,
  }, {
    variant: names[variant] || variant,
    layer: String(layer),
    seedCount: String(seedCount),
    mostExpert: String(utilization.mostUsed.expert),
    mostShare: formatPercent(utilization.mostUsed.mean),
    leastExpert: String(utilization.leastUsed.expert),
    leastShare: formatPercent(utilization.leastUsed.mean),
    spread: (utilization.spread * 100).toFixed(1),
    entropy: typeof utilization.normalizedEntropy === "number"
      ? `${(utilization.normalizedEntropy * 100).toFixed(1)}% of maximum`
      : "unavailable",
    expertShares: utilization.experts
      .map(({ expert, mean }) => `Expert ${expert}: ${formatPercent(mean)}`)
      .join("; "),
  });
}

function renderRoutingUtilization(routing, variant, layer) {
  const container = root.querySelector("#routing-utilization-chart");
  const status = root.querySelector("#routing-status");
  if (!container) return;
  const runs = routing.runs.filter((run) => run.variant === variant);
  const seedValues = runs
    .map((run) => run.utilization?.[layer])
    .filter((values) => Array.isArray(values));
  if (!seedValues.length) return;
  const experts = seedValues[0].map((_, expert) => expert);
  const summaries = experts.map((expert) =>
    meanAndStd(seedValues.map((values) => values[expert])));
  renderPlot(container, [{
    type: "bar",
    x: experts.map((expert) => "Expert " + expert),
    y: summaries.map(({ mean }) => mean),
    error_y: {
      type: "data",
      array: summaries.map(({ std }) => std),
      visible: true,
      width: 5,
    },
    marker: { color: experts.map((expert) => colors[variant] || `hsl(${expert * 45},65%,48%)`) },
    hovertemplate: "%{x}<br>selection share: %{y:.3f}<extra></extra>",
  }], {
    showlegend: false,
    xaxis: { title: "Stored expert", automargin: true },
    yaxis: { title: "Share of top-k selections", range: [0, 1], automargin: true },
  });
  const entropies = runs
    .map((run) => run.router_entropy?.[layer])
    .filter((value) => typeof value === "number");
  const maximum = runs[0].maximum_router_entropy;
  const utilization = summarizeRoutingUtilization(
    seedValues,
    entropies,
    maximum,
  );
  if (status && entropies.length) {
    const entropy = meanAndStd(entropies);
    status.textContent = `${names[variant] || variant} · layer ${layer} · ` +
      `${seedValues.length} seeds · router entropy ${entropy.mean.toFixed(3)} / ` +
      `${maximum.toFixed(3)} maximum`;
  }
  updateRoutingStory(variant, layer, seedValues.length, utilization);
}

function renderRoutingStability(routing) {
  const container = root.querySelector("#routing-stability-chart");
  if (!container) return;
  const variants = routing.cross_seed_routing_stability?.variants || {};
  const traces = Object.entries(variants).flatMap(([variant, payload]) => {
    const points = Object.entries(payload.per_layer || {})
      .sort(([left], [right]) => Number(left) - Number(right));
    if (!points.length) return [];
    return [{
      type: "scatter",
      mode: "lines+markers",
      name: shortNames[variant] || variant,
      x: points.map(([layer]) => Number(layer)),
      y: points.map(([, summary]) => summary.mean),
      error_y: {
        type: "data",
        array: points.map(([, summary]) => summary.std ?? 0),
        visible: true,
        width: 3,
      },
      line: { color: colors[variant], width: 2 },
      marker: { color: colors[variant], size: 7 },
      customdata: points.map(([, summary]) => summary.n),
      hovertemplate: "%{fullData.name}<br>layer: %{x}<br>held-out agreement: %{y:.3f}" +
        "<br>seed pairs=%{customdata}<extra></extra>",
    }];
  });
  renderPlot(container, traces, {
    xaxis: { title: "Expert layer", dtick: 1, automargin: true },
    yaxis: {
      title: "Aligned cross-seed top-1 routing agreement",
      range: [0, 1],
      automargin: true,
    },
  });
}

async function setupRouting() {
  const variantSelect = root.querySelector("#routing-variant");
  const layerSelect = root.querySelector("#routing-layer");
  if (!variantSelect || !layerSelect) return;
  const routing = await fetchJson(root.dataset.routingUrl);
  const variants = [...new Set(routing.runs.map((run) => run.variant))].sort();
  variantSelect.replaceChildren(...variants.map((variant) =>
    new Option(names[variant] || variant, variant)));
  const setLayers = () => {
    const layers = [...new Set(routing.runs
      .filter((run) => run.variant === variantSelect.value)
      .flatMap((run) => Object.keys(run.utilization || {})))]
      .sort((left, right) => Number(left) - Number(right));
    layerSelect.replaceChildren(...layers.map((layer) =>
      new Option("Layer " + layer, layer)));
    renderRoutingUtilization(routing, variantSelect.value, layerSelect.value);
  };
  variantSelect.addEventListener("change", setLayers);
  layerSelect.addEventListener("change", () =>
    renderRoutingUtilization(routing, variantSelect.value, layerSelect.value));
  setLayers();
  renderRoutingStability(routing);
}

function attentionSelection(layer, selected) {
  const isMean = selected === "mean";
  return {
    weights: isMean
      ? layer.mean_weights
      : layer.heads.find((item) => String(item.head) === selected)?.weights,
    label: isMean ? "mean across heads" : `head ${selected}`,
    meaningKey: isMean ? "selectionMean" : "selectionHead",
  };
}

function updateAttentionStory(variant, layer, selection, heads) {
  const content = readStoryContent("attention-story-content");
  const architecture = content.variants?.[variant];
  const summary = summarizeAttentionWeights(selection.weights);
  if (!architecture || !summary) return;
  updateOptionStory("attention-story", storyView(content, {
    eyebrow: `${names[variant] || variant} · layer ${layer}`,
    tradeoff: architecture,
  }), {
    variant: names[variant] || variant,
    layer: String(layer),
    headLabel: selection.label,
    selfMass: formatPercent(summary.selfMass),
    recentMass: formatPercent(summary.recentMass),
    meanDistance: summary.meanBackwardDistance.toFixed(1),
    headComparison: heads
      .map(({ head, weights: headWeights }) => {
        const headSummary = summarizeAttentionWeights(headWeights);
        return `Head ${head}: ${formatPercent(headSummary.recentMass)}`;
      })
      .join("; "),
    selectionMeaning: content[selection.meaningKey],
  });
}

function updateUnsupportedAttentionStory(variant, reason) {
  const content = readStoryContent("attention-story-content");
  updateOptionStory("attention-story", storyView({}, {
    eyebrow: content.unsupportedEyebrow,
    title: content.unsupportedTitle,
    graph: content.unsupportedGraph,
    driverHeading: content.unsupportedDriverHeading,
    driver: content.unsupportedDriver,
    tradeoffHeading: content.unsupportedTradeoffHeading,
    tradeoff: content.unsupportedTradeoff,
    groupsHeading: content.unsupportedGroupsHeading,
    groups: content.unsupportedGroups,
    conclusion: content.unsupportedConclusion,
  }), {
    variant: names[variant] || variant,
    reason,
  });
}

function updateAttentionLoadingStory(variant) {
  const content = readStoryContent("attention-story-content");
  updateOptionStory("attention-story", storyView({}, {
    eyebrow: content.loadingEyebrow,
    title: content.loadingTitle,
    graph: content.loadingGraph,
    conclusion: content.loadingConclusion,
  }), {
    variant: names[variant] || variant,
  });
}

function updateAttentionFailureStory(variant, reason) {
  const content = readStoryContent("attention-story-content");
  updateOptionStory("attention-story", storyView({}, {
    eyebrow: content.failureEyebrow,
    title: content.failureTitle,
    graph: content.failureGraph,
    driverHeading: content.failureDriverHeading,
    driver: content.failureDriver,
    tradeoffHeading: content.failureTradeoffHeading,
    tradeoff: content.failureTradeoff,
    conclusion: content.failureConclusion,
  }), {
    variant: names[variant] || variant,
    reason,
  });
}

async function setupAttention() {
  const variantSelect = root.querySelector("#attention-variant");
  const layerSelect = root.querySelector("#attention-layer");
  const headSelect = root.querySelector("#attention-head");
  const status = root.querySelector("#attention-status");
  const chart = root.querySelector("#attention-chart");
  if (!variantSelect || !layerSelect || !headSelect || !status || !chart) return;
  const index = await fetchJson(root.dataset.attentionIndexUrl);
  let payload = null;
  let requestId = 0;
  const render = () => {
    if (!payload) return;
    const layer = payload.layers.find((item) => String(item.layer) === layerSelect.value);
    if (!layer) return;
    const selection = attentionSelection(layer, headSelect.value);
    if (!selection.weights) return;
    status.textContent = names[payload.variant] + " · layer " + layer.layer + " · " +
      selection.label + " · " + selection.weights.length + " tokens";
    updateAttentionStory(payload.variant, layer.layer, selection, layer.heads);
    renderPlot(chart, [{
      type: "heatmap",
      z: selection.weights,
      x: payload.tokens,
      y: payload.tokens,
      zmin: 0,
      colorscale: "Magma",
      colorbar: { title: { text: "Probability", side: "right" } },
      hovertemplate: "Query: %{y}<br>Key: %{x}<br>probability: %{z:.5f}<extra></extra>",
    }], {
      showlegend: false,
      xaxis: { title: "Key token", tickangle: -45, automargin: true },
      yaxis: { title: "Query token", autorange: "reversed", automargin: true },
      margin: { l: 90, r: 90, t: 28, b: 110 },
    });
  };
  const loadVariant = async () => {
    const currentRequest = ++requestId;
    const requestedVariant = variantSelect.value;
    const entry = attentionAssetFor(index, requestedVariant);
    payload = null;
    chart.hidden = true;
    layerSelect.disabled = true;
    headSelect.disabled = true;
    layerSelect.replaceChildren();
    headSelect.replaceChildren();
    if (entry.status !== "supported") {
      status.textContent = entry.reason ||
        "A pairwise attention matrix is not defined for this recipe.";
      updateChartData(chart, [], status.textContent);
      updateUnsupportedAttentionStory(requestedVariant, status.textContent);
      return;
    }
    status.textContent = "Loading " + names[requestedVariant] + " attention…";
    updateAttentionLoadingStory(requestedVariant);
    try {
      const response = await fetchJson(root.dataset.attentionBaseUrl + entry.asset);
      if (currentRequest !== requestId || requestedVariant !== variantSelect.value) return;
      payload = response;
      layerSelect.replaceChildren(...payload.layers.map(({ layer }) =>
        new Option("Layer " + layer, String(layer))));
      const heads = payload.layers[0]?.heads || [];
      headSelect.replaceChildren(
        new Option("Mean", "mean"),
        ...heads.map(({ head }) => new Option("Head " + head, String(head))),
      );
      layerSelect.disabled = false;
      headSelect.disabled = false;
      chart.hidden = false;
      render();
    } catch (error) {
      if (currentRequest !== requestId || requestedVariant !== variantSelect.value) return;
      payload = null;
      const reason = error instanceof Error ? error.message : String(error);
      status.textContent = failureText("status", reason);
      updateChartData(chart, [], status.textContent);
      updateAttentionFailureStory(requestedVariant, reason);
    }
  };
  variantSelect.addEventListener("change", loadVariant);
  layerSelect.addEventListener("change", render);
  headSelect.addEventListener("change", render);
  await loadVariant();
}

async function setupSummaryViews() {
  if (root.querySelector(
    "#variant-comparison, #fixed-data-chart, #learning-curves-chart, " +
    "#pareto-chart, #throughput-chart, #context-chart",
  )) {
    const summary = await fetchJson(root.dataset.summaryUrl);
    renderComparisonTable(summary);
    renderFixedData(summary);
    setupLearningTabs(summary);
    renderPareto(summary);
    setupThroughput(summary);
    setupContext(summary);
    const revision = summary.provenance?.evaluationExportRevision
      || summary.provenance?.commit;
    for (const link of root.querySelectorAll("[data-source-commit-link]")) {
      if (!revision) continue;
      link.href = `${summary.provenance.repository}/commit/${revision}`;
      link.querySelector("[data-source-commit-label]")?.replaceChildren(
        document.createTextNode(revision.slice(0, 12)),
      );
    }
  }
}

async function initialize() {
  await Promise.all([
    runSetup(setupSummaryViews, {
      chartIds: [
        "fixed-data-chart",
        "learning-curves-chart",
        "pareto-chart",
        "throughput-chart",
        "context-chart",
      ],
      storyIds: ["learning-story", "context-story"],
      controlSelectors: [
        "[data-learning-axis]",
        "[data-throughput-metric]",
        "#context-metric",
      ],
    }),
    runSetup(setupInternals, {
      chartIds: ["stable-rank-chart", "cka-chart"],
    }),
    runSetup(setupAttention, {
      chartIds: ["attention-chart"],
      storyIds: ["attention-story"],
      controlSelectors: [
        "#attention-variant",
        "#attention-layer",
        "#attention-head",
      ],
      statusId: "attention-status",
    }),
    runSetup(setupRetrieval, {
      chartIds: ["retrieval-chart"],
      storyIds: ["retrieval-story"],
      controlSelectors: [
        "#retrieval-task",
        "#retrieval-configuration",
        "#retrieval-distance",
      ],
    }),
    runSetup(setupRouting, {
      chartIds: ["routing-utilization-chart", "routing-stability-chart"],
      storyIds: ["routing-story"],
      controlSelectors: ["#routing-variant", "#routing-layer"],
      statusId: "routing-status",
    }),
  ]);
}

await initialize();
