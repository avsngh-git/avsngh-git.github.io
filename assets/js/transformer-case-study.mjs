import {
  attentionAssetFor,
  buildComparisonRows,
  contextSeries,
  metricSeries,
} from "./transformer-case-study-data.mjs";

const root = document.querySelector("#transformer-case-study");
if (!root) throw new Error("Transformer Variants case-study root was not found.");

const names = {
  alibi: "ALiBI", gqa: "GQA", linear: "Causal linear", modern: "Modern",
  moe: "MoE", moe_deep: "MoE deep", moe_interleaved: "MoE interleaved",
  swa: "SWA", swa_interleaved: "SWA interleaved", vanilla: "Vanilla",
};
const colors = {
  alibi: "#007bff", gqa: "#17a2b8", linear: "#495057", modern: "#0056b3",
  moe: "#6f42c1", moe_deep: "#6610f2", moe_interleaved: "#845ef7",
  swa: "#4c6ef5", swa_interleaved: "#748ffc", vanilla: "#adb5bd",
};
const compact = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const rate = (value) => (value >= 1000 ? compact.format(value) : value.toFixed(2)) + " tok/s";

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error("Could not load " + url + " (" + response.status + ").");
  return response.json();
}

function setupLearningTabs() {
  const buttons = [...root.querySelectorAll("[data-learning-axis]")];
  const plots = [...root.querySelectorAll("[data-learning-plot-link]")];
  const zoom = root.querySelector("[data-learning-zoom]");
  if (!buttons.length || !plots.length) return;
  const select = (axis) => {
    for (const candidate of buttons) {
      const active = candidate.dataset.learningAxis === axis;
      candidate.classList.toggle("is-active", active);
      candidate.setAttribute("aria-pressed", String(active));
    }
    for (const plot of plots) plot.hidden = plot.dataset.learningPlotLink !== axis;
    const activePlot = plots.find((plot) => plot.dataset.learningPlotLink === axis);
    if (zoom && activePlot) zoom.href = activePlot.href;
  };
  for (const button of buttons) {
    button.addEventListener("click", () => select(button.dataset.learningAxis));
  }
  select(buttons.find((button) => button.classList.contains("is-active"))?.dataset.learningAxis || "tokens");
}

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
      const delta = typeof left === "string" ? left.localeCompare(right) : Number(left) - Number(right);
      return delta * sort.direction;
    });
    body.replaceChildren(...ordered.map((row) => {
      const tr = document.createElement("tr");
      const tail = row.tailPerplexity4k.status === "ok"
        ? row.tailPerplexity4k.mean.toFixed(2) + " ± " + row.tailPerplexity4k.std.toFixed(2)
        : badge("Unsupported");
      tr.append(
        cell(names[row.variant] || row.variant),
        cell(row.fixedDataLoss.mean.toFixed(4) + " ± " + row.fixedDataLoss.std.toFixed(4)),
        cell((row.activeParameters / 1e6).toFixed(1) + "M"),
        cell((row.totalParameters / 1e6).toFixed(1) + "M"),
        cell(row.generationTokensPerSecond.toFixed(2)),
        cell(tail),
        cell(compact.format(row.prefillTokensPerSecond4k)),
        cell(badge(row.cacheStatus === "ok" ? "Supported" : "Unsupported", row.cacheStatus === "ok")),
      );
      return tr;
    }));
    for (const button of table.querySelectorAll("[data-sort]")) {
      const active = button.dataset.sort === sort.key;
      button.closest("th")?.setAttribute("aria-sort", active ? (sort.direction === 1 ? "ascending" : "descending") : "none");
      const clean = button.textContent.replace(/\s[▲▼]$/, "");
      button.textContent = active ? clean + " " + (sort.direction === 1 ? "▲" : "▼") : clean;
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

function renderThroughput(summary, metric) {
  const container = root.querySelector("#throughput-chart");
  if (!container) return;
  const series = metricSeries(summary, metric).sort((a, b) => b.value - a.value);
  const maximum = Math.max(...series.map((item) => item.value));
  container.replaceChildren(...series.map(({ variant, value }) => {
    const row = document.createElement("div");
    row.className = "tvc-bar-row";
    row.title = names[variant] + ": " + rate(value);
    const label = document.createElement("span");
    label.className = "tvc-bar-label";
    label.textContent = names[variant] || variant;
    const track = document.createElement("span");
    track.className = "tvc-bar-track";
    const bar = document.createElement("span");
    bar.className = "tvc-bar";
    bar.style.width = (value / maximum * 100) + "%";
    bar.style.background = colors[variant];
    track.append(bar);
    const shown = document.createElement("span");
    shown.className = "tvc-bar-value";
    shown.textContent = rate(value);
    row.append(label, track, shown);
    return row;
  }));
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
  };
  for (const button of buttons) {
    button.addEventListener("click", () => select(button.dataset.throughputMetric));
  }
  select(buttons.find((button) => button.classList.contains("is-active"))?.dataset.throughputMetric || "generationTokensPerSecond");
}

const svgNamespace = "http://www.w3.org/2000/svg";
function svgElement(name, attributes = {}) {
  const element = document.createElementNS(svgNamespace, name);
  for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
  return element;
}
function renderContextChart(summary, metric) {
  const container = root.querySelector("#context-chart");
  if (!container) return;
  const series = contextSeries(summary, metric);
  const available = series.flatMap(({ points }) =>
    points.filter((point) => point.status === "ok" && typeof point.mean === "number"));
  const useLog = metric === "tailPerplexity";
  const transformed = available.flatMap(({ mean, std }) => [mean - std, mean + std])
    .filter((value) => value > 0)
    .map((value) => useLog ? Math.log10(value) : value);
  const min = Math.min(...transformed);
  const max = Math.max(...transformed);
  const pad = { top: 22, right: 26, bottom: 48, left: 72 };
  const width = 860;
  const height = 440;
  const innerWidth = width - pad.left - pad.right;
  const innerHeight = height - pad.top - pad.bottom;
  const contexts = [1024, 2048, 4096];
  const x = (value) => pad.left + contexts.indexOf(value) / 2 * innerWidth;
  const y = (value) => {
    const scaled = ((useLog ? Math.log10(value) : value) - min) / (max - min || 1);
    return pad.top + (1 - scaled) * innerHeight;
  };
  const svg = svgElement("svg", {
    viewBox: "0 0 " + width + " " + height, role: "img",
    "aria-label": useLog
      ? "Log-scale tail perplexity at one, two, and four thousand token contexts"
      : "Prefill throughput at one, two, and four thousand token contexts",
  });
  for (const context of contexts) {
    svg.append(svgElement("line", {
      class: "grid", x1: x(context), x2: x(context), y1: pad.top, y2: height - pad.bottom,
    }));
    const label = svgElement("text", { x: x(context), y: height - 17, "text-anchor": "middle" });
    label.textContent = context / 1024 + "K";
    svg.append(label);
  }
  for (let tick = 0; tick <= 4; tick += 1) {
    const position = pad.top + tick / 4 * innerHeight;
    const raw = max - tick / 4 * (max - min);
    const value = useLog ? 10 ** raw : raw;
    svg.append(svgElement("line", {
      class: "grid", x1: pad.left, x2: width - pad.right, y1: position, y2: position,
    }));
    const label = svgElement("text", { x: pad.left - 10, y: position + 4, "text-anchor": "end" });
    label.textContent = value >= 1000 ? compact.format(value) : value.toFixed(value < 100 ? 1 : 0);
    svg.append(label);
  }
  svg.append(
    svgElement("line", { class: "axis", x1: pad.left, x2: pad.left, y1: pad.top, y2: height - pad.bottom }),
    svgElement("line", { class: "axis", x1: pad.left, x2: width - pad.right, y1: height - pad.bottom, y2: height - pad.bottom }),
  );
  for (const item of series) {
    const points = item.points.filter((point) => point.status === "ok" && typeof point.mean === "number");
    if (!points.length) continue;
    svg.append(svgElement("path", {
      d: points.map((point, index) => (index ? "L " : "M ") + x(point.context) + " " + y(point.mean)).join(" "),
      fill: "none", stroke: colors[item.variant], "stroke-width": 2.5, "stroke-linejoin": "round",
    }));
    for (const point of points) {
      const errorTop = y(point.mean + point.std);
      const errorBottom = y(Math.max(Number.EPSILON, point.mean - point.std));
      const errorStyle = { stroke: colors[item.variant], "stroke-width": 1.25, opacity: .72 };
      svg.append(
        svgElement("line", {
          ...errorStyle, x1: x(point.context), x2: x(point.context),
          y1: errorTop, y2: errorBottom,
        }),
        svgElement("line", { ...errorStyle, x1: x(point.context) - 4, x2: x(point.context) + 4, y1: errorTop, y2: errorTop }),
        svgElement("line", { ...errorStyle, x1: x(point.context) - 4, x2: x(point.context) + 4, y1: errorBottom, y2: errorBottom }),
      );
      const circle = svgElement("circle", {
        cx: x(point.context), cy: y(point.mean), r: 4.5,
        fill: colors[item.variant], stroke: "#fff", "stroke-width": 1.5,
      });
      const title = svgElement("title");
      title.textContent = names[item.variant] + " · " + point.context / 1024 + "K: " +
        point.mean.toFixed(2) + " ± " + point.std.toFixed(2);
      circle.append(title);
      svg.append(circle);
    }
  }
  const scaleLabel = svgElement("text", { x: pad.left, y: 13 });
  scaleLabel.textContent = useLog
    ? "Tail perplexity · logarithmic scale · lower is better"
    : "Prefill tokens/s · higher is better";
  svg.append(scaleLabel);
  const legend = document.createElement("div");
  legend.className = "tvc-chart-legend";
  for (const { variant } of series) {
    const label = document.createElement("span");
    const dot = document.createElement("i");
    dot.style.background = colors[variant];
    label.append(dot, names[variant] || variant);
    legend.append(label);
  }
  container.replaceChildren(svg, legend);
}
function setupContext(summary) {
  const select = root.querySelector("#context-metric");
  select?.addEventListener("change", () => renderContextChart(summary, select.value));
  renderContextChart(summary, select?.value || "tailPerplexity");
}

function heatColor(value, maximum) {
  const ratio = Math.max(0, Math.min(1, Math.sqrt(value / (maximum || 1))));
  const stops = [[8,20,31], [16,78,111], [5,166,154], [183,211,61], [255,232,146]];
  const scaled = ratio * (stops.length - 1);
  const low = Math.floor(scaled);
  const high = Math.min(stops.length - 1, low + 1);
  const blend = scaled - low;
  const channels = stops[low].map((channel, index) =>
    Math.round(channel + (stops[high][index] - channel) * blend));
  return "rgb(" + channels.join(",") + ")";
}
function drawAttention(canvas, weights, tokens) {
  const context = canvas.getContext("2d");
  const size = weights.length;
  const margin = 76;
  const plot = Math.min(canvas.width - margin - 20, canvas.height - margin - 20);
  const cellSize = plot / size;
  const maximum = Math.max(...weights.flat());
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#101820";
  context.fillRect(0, 0, canvas.width, canvas.height);
  for (let row = 0; row < size; row += 1) {
    for (let column = 0; column < size; column += 1) {
      context.fillStyle = heatColor(weights[row][column], maximum);
      context.fillRect(margin + column * cellSize, 18 + row * cellSize, cellSize + .3, cellSize + .3);
    }
  }
  context.fillStyle = "#dce8ed";
  context.font = "10px system-ui";
  context.textAlign = "right";
  context.textBaseline = "middle";
  for (let index = 0; index < size; index += 8) {
    const label = (tokens[index] || String(index)).replace(/\s/g, "·").slice(0, 9);
    context.fillText(label, margin - 7, 18 + (index + .5) * cellSize);
  }
  context.save();
  context.translate(margin, 18 + plot + 8);
  context.rotate(-Math.PI / 4);
  for (let index = 0; index < size; index += 8) {
    const label = (tokens[index] || String(index)).replace(/\s/g, "·").slice(0, 9);
    context.fillText(label, index * cellSize, 0);
  }
  context.restore();
}
async function setupAttention() {
  const variantSelect = root.querySelector("#attention-variant");
  const layerSelect = root.querySelector("#attention-layer");
  const headSelect = root.querySelector("#attention-head");
  const status = root.querySelector("#attention-status");
  const canvas = root.querySelector("#attention-canvas");
  if (!variantSelect || !layerSelect || !headSelect || !status || !canvas) return;
  const index = await fetchJson(root.dataset.attentionIndexUrl);
  let payload = null;
  const render = () => {
    if (!payload) return;
    const layer = payload.layers.find((item) => String(item.layer) === layerSelect.value);
    if (!layer) return;
    const selected = headSelect.value;
    const weights = selected === "mean"
      ? layer.mean_weights
      : layer.heads.find((item) => String(item.head) === selected)?.weights;
    if (!weights) return;
    drawAttention(canvas, weights, payload.tokens);
    const label = selected === "mean" ? "mean across heads" : "head " + selected;
    status.textContent = names[payload.variant] + " · layer " + layer.layer + " · " + label +
      " · " + weights.length + " tokens";
  };
  const loadVariant = async () => {
    const entry = attentionAssetFor(index, variantSelect.value);
    if (entry.status !== "supported") {
      payload = null;
      canvas.hidden = true;
      layerSelect.replaceChildren();
      headSelect.replaceChildren();
      status.textContent = entry.reason || "A pairwise attention matrix is not defined for this recipe.";
      return;
    }
    status.textContent = "Loading " + names[variantSelect.value] + " attention…";
    canvas.hidden = true;
    try {
      payload = await fetchJson(root.dataset.attentionBaseUrl + entry.asset);
      layerSelect.replaceChildren(...payload.layers.map(({ layer }) =>
        new Option("Layer " + layer, String(layer))));
      const heads = payload.layers[0]?.heads || [];
      headSelect.replaceChildren(
        new Option("Mean", "mean"),
        ...heads.map(({ head }) => new Option("Head " + head, String(head))),
      );
      canvas.hidden = false;
      render();
    } catch (error) {
      payload = null;
      status.textContent = error.message;
    }
  };
  variantSelect.addEventListener("change", loadVariant);
  layerSelect.addEventListener("change", render);
  headSelect.addEventListener("change", render);
  await loadVariant();
}

async function initialize() {
  setupLearningTabs();
  if (root.querySelector("#variant-comparison, #throughput-chart, #context-chart")) {
    const summary = await fetchJson(root.dataset.summaryUrl);
    renderComparisonTable(summary);
    setupThroughput(summary);
    setupContext(summary);
  }
  await setupAttention();
}
initialize().catch((error) => {
  for (const loading of root.querySelectorAll(".tvc-loading")) {
    loading.textContent = "Interactive data could not be loaded: " + error.message;
  }
  const status = root.querySelector("#attention-status");
  if (status) status.textContent = "Attention explorer unavailable: " + error.message;
});
