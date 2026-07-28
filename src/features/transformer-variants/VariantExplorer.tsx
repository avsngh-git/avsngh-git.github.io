import { useRef, useState } from "react";

type Variant = {
  id: string;
  name: string;
  role: string;
  changes: string;
  motivation: string;
  tradeoff: string;
  result: string;
  tags: string[];
};

const variants: Variant[] = [
  {
    id: "vanilla",
    name: "Vanilla",
    role: "Classic reference",
    changes:
      "A GPT-style decoder with learned absolute positions, full multi-head attention, LayerNorm, and a dense GELU feed-forward network.",
    motivation:
      "This is the familiar reference point. It shows whether newer recipes improve on a transparent, conventional Transformer under the same training budget.",
    tradeoff:
      "Its mature dense operations are easy to optimize, but learned position vectors exist only for positions seen during training.",
    result:
      "It reached 3.9400 validation loss and led short KV-cached generation at 512.8 tokens/s. Evaluation beyond the 1K position table is correctly marked unsupported.",
    tags: ["Learned positions", "Full attention", "Dense FFN"],
  },
  {
    id: "modern",
    name: "Modern",
    role: "Dense quality baseline",
    changes:
      "It combines rotary position embeddings (RoPE), full scaled dot-product attention, RMSNorm, and a dense SwiGLU feed-forward network.",
    motivation:
      "This recipe asks how much a current dense Transformer stack improves on the classic baseline before more specialized mechanisms are introduced.",
    tradeoff:
      "It offers strong in-range quality and optimized dense kernels, but unscaled RoPE may encounter unfamiliar rotations beyond the training length.",
    result:
      "It improved validation loss to 3.8099 and trained at 69.7K tokens/s. Its tail perplexity rose sharply from 49.96 at 1K to 410.08 at 4K.",
    tags: ["RoPE", "Full attention", "Dense SwiGLU"],
  },
  {
    id: "alibi",
    name: "ALiBI",
    role: "Position experiment",
    changes:
      "It replaces position embeddings with a linear distance penalty inside attention. Different heads receive different slopes, creating local and broad distance preferences.",
    motivation:
      "The test asks whether a position rule that remains mathematically unchanged at longer lengths transfers better beyond the 1K training context.",
    tradeoff:
      "The explicit recency bias can improve extrapolation, but it may penalize distant information and weaken quality inside the training range.",
    result:
      "Its 1K loss was weaker at 4.1172, yet it produced the best 4K tail perplexity: 74.35 ± 1.14.",
    tags: ["Linear distance bias", "Full attention", "Long-context"],
  },
  {
    id: "gqa",
    name: "GQA",
    role: "KV-memory experiment",
    changes:
      "Eight query heads share two key and value head pairs. Queries remain specialized, while the stored key/value state is reduced.",
    motivation:
      "Grouped-query attention tests whether a smaller key-value cache can reduce parameters and memory traffic without giving up too much prediction quality.",
    tradeoff:
      "Sharing key and value heads lowers cache size, but it also removes head-specific capacity and does not guarantee lower latency at every batch shape.",
    result:
      "It trained at about 80.2K tokens/s and used 48.28M active parameters, but validation loss worsened to 4.1807.",
    tags: ["RoPE", "2 KV heads", "Smaller KV cache"],
  },
  {
    id: "swa",
    name: "SWA",
    role: "Local-attention experiment",
    changes:
      "Sliding-window attention lets each token attend only to itself and the previous 255 tokens instead of the full earlier sequence.",
    motivation:
      "The experiment asks how much speed and length stability a fixed local view can provide, and what is lost when distant tokens cannot be addressed directly.",
    tradeoff:
      "The work grows with sequence length times window size, but direct long-range retrieval is restricted by design.",
    result:
      "It trained at 80.2K tokens/s and led 4K prompt prefill at 204.9K tokens/s. Its stable perplexity came with zero exact distant-retrieval success.",
    tags: ["RoPE", "256-token window", "Fast prefill"],
  },
  {
    id: "swa-interleaved",
    name: "SWA interleaved",
    role: "Hybrid-attention experiment",
    changes:
      "Even layers use full attention and odd layers use a 256-token sliding window, alternating global and local token interaction.",
    motivation:
      "This hybrid asks whether occasional global layers can restore long-range paths while retaining some of local attention's efficiency.",
    tradeoff:
      "Global layers add cost and may disrupt the local stability benefit. Their presence also does not prove that the trained model uses distant information.",
    result:
      "It did not improve fixed-data loss over pure SWA and exact retrieval remained zero. Its 4K tail perplexity rose to 96.95.",
    tags: ["RoPE", "Global + local", "Hybrid"],
  },
  {
    id: "linear",
    name: "Causal linear",
    role: "Complexity experiment",
    changes:
      "An ELU+1 feature map replaces the pairwise softmax matrix with recurrent prefix statistics stored in a fixed-size state.",
    motivation:
      "The test separates attractive linear scaling on paper from the throughput and quality actually delivered by a concrete GPU implementation.",
    tradeoff:
      "Its state size does not grow with context, but approximate attention and serial recurrence can reduce quality and hardware utilization.",
    result:
      "It reached 4.0782 loss and 53.4K training tokens/s. Its 4K prefill was the slowest supported result at 34.3K tokens/s.",
    tags: ["RoPE", "Prefix state", "Linear scaling"],
  },
  {
    id: "moe",
    name: "MoE",
    role: "Conditional-capacity experiment",
    changes:
      "Each dense feed-forward block becomes eight experts. A learned router selects two experts for each token, so only part of the stored network is active.",
    motivation:
      "Mixture of experts tests whether more stored, conditional capacity improves prediction when active parameters per token remain close to the dense baseline.",
    tradeoff:
      "Routing expands stored capacity, but expert dispatch adds memory, synchronization, imbalance risk, and slower training.",
    result:
      "It achieved the best validation loss, 3.6862, at 51.46M active parameters. It stored 103.37M parameters and trained at 31.2K tokens/s.",
    tags: ["RoPE", "Top-2 of 8 experts", "Best loss"],
  },
  {
    id: "moe-interleaved",
    name: "MoE interleaved",
    role: "Expert-placement experiment",
    changes:
      "Expert feed-forward blocks appear in alternating layers, while the remaining layers keep the dense Modern feed-forward network.",
    motivation:
      "This placement asks whether part-time conditional capacity can preserve much of MoE's quality benefit with fewer expert layers.",
    tradeoff:
      "It reduces stored experts and routing frequency, but may limit where specialization can develop across model depth.",
    result:
      "It remained among the strongest fixed-data recipes while occupying a middle ground between dense execution and full MoE capacity.",
    tags: ["Alternating experts", "Top-2 routing", "Partial MoE"],
  },
  {
    id: "moe-deep",
    name: "MoE deep",
    role: "Expert-placement experiment",
    changes:
      "The first half of the network stays dense and expert feed-forward blocks replace the deeper half.",
    motivation:
      "This version tests whether experts are more valuable after earlier layers have already formed general token representations.",
    tradeoff:
      "Late specialization may concentrate useful capacity, but it delays routing and cannot provide expert computation in shallow layers.",
    result:
      "It tested a depth-specific specialization hypothesis while keeping the same controlled data, training, and evaluation protocol as the other recipes.",
    tags: ["Deep-layer experts", "Top-2 routing", "Partial MoE"],
  },
];

export function VariantExplorer() {
  const [selected, setSelected] = useState(0);
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  const variant = variants[selected];

  const selectAndFocus = (index: number) => {
    const next = (index + variants.length) % variants.length;
    setSelected(next);
    tabs.current[next]?.focus();
  };

  return (
    <section className="tvc-section tvc-variant-explorer" aria-labelledby="variant-explorer-title">
      <div className="tvc-section-heading tvc-reading-width">
        <p className="tvc-section-kicker">Interactive variant guide</p>
        <h2 id="variant-explorer-title">Start with the baseline, then change one idea at a time</h2>
        <p>
          Choose a recipe to see what changed, why it was included, and which trade-off
          the experiment was designed to reveal.
        </p>
      </div>

      <div className="tvc-variant-tabs">
        <div className="tvc-tab-list" role="tablist" aria-label="Transformer variants">
          {variants.map((item, index) => (
            <button
              aria-controls={`variant-panel-${item.id}`}
              aria-selected={selected === index}
              className="tvc-tab"
              id={`variant-tab-${item.id}`}
              key={item.id}
              onClick={() => setSelected(index)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                  event.preventDefault();
                  selectAndFocus(selected + 1);
                } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                  event.preventDefault();
                  selectAndFocus(selected - 1);
                } else if (event.key === "Home") {
                  event.preventDefault();
                  selectAndFocus(0);
                } else if (event.key === "End") {
                  event.preventDefault();
                  selectAndFocus(variants.length - 1);
                }
              }}
              ref={(element) => {
                tabs.current[index] = element;
              }}
              role="tab"
              tabIndex={selected === index ? 0 : -1}
              type="button"
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {item.name}
            </button>
          ))}
        </div>

        <article
          aria-labelledby={`variant-tab-${variant.id}`}
          className="tvc-tab-panel"
          id={`variant-panel-${variant.id}`}
          role="tabpanel"
          tabIndex={0}
        >
          <header>
            <p>{variant.role}</p>
            <h3>{variant.name}</h3>
            <ul aria-label={`${variant.name} characteristics`}>
              {variant.tags.map((tag) => (
                <li key={tag}>{tag}</li>
              ))}
            </ul>
          </header>
          <div className="tvc-variant-explanation">
            <div>
              <span>01</span>
              <h4>What changes?</h4>
              <p>{variant.changes}</p>
            </div>
            <div>
              <span>02</span>
              <h4>Why test it?</h4>
              <p>{variant.motivation}</p>
            </div>
            <div>
              <span>03</span>
              <h4>Expected trade-off</h4>
              <p>{variant.tradeoff}</p>
            </div>
            <div className="tvc-variant-result">
              <span>04</span>
              <h4>Headline result</h4>
              <p>{variant.result}</p>
            </div>
          </div>
        </article>
      </div>
      <p className="tvc-tab-help">
        Tip: use the arrow keys to move between tabs. The full component matrix follows
        below for side-by-side reference.
      </p>
    </section>
  );
}
