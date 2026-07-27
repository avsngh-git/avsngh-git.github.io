import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import architecture from "../content/transformer-variants/architecture.html?raw";
import experiments from "../content/transformer-variants/experiments.html?raw";
import internals from "../content/transformer-variants/internals.html?raw";
import overview from "../content/transformer-variants/overview.html?raw";
import results from "../content/transformer-variants/results.html?raw";
import { CaseStudyRuntime } from "../features/transformer-variants/CaseStudyRuntime";
import {
  CASE_STUDY_ASSET_VERSION,
  caseStudyAssets,
} from "../features/transformer-variants/config";
import "../styles/case-study.scss";
import { useThemeMode } from "../theme/theme";

const chapters = [
  {
    id: "overview",
    number: "01",
    label: "Overview",
    title: "Transformer Variants: what changed, what improved, and what it cost",
    intro:
      "A five-seed comparison of ten approximately 50M-active-parameter decoder recipes across prediction quality, long-context extrapolation, throughput, internal representations, routing, and operational reliability.",
    html: overview,
  },
  {
    id: "architecture",
    number: "02",
    label: "Architecture choices",
    title: "The architectural choices, compared mechanism by mechanism",
    intro:
      "Learned positions, RoPE, ALiBI, full attention, GQA, sliding windows, linear recurrence, dense feed-forwards, and MoE each change a different part of the computation—and create different expectations.",
    html: architecture,
  },
  {
    id: "experiments",
    number: "03",
    label: "Experimental design",
    title: "A fair comparison is an experimental system, not a leaderboard",
    intro:
      "The corpus, tokenizer, sequence length, token budget, optimizer, target windows, and uncertainty units were held fixed so architectural mechanisms—not accidental pipeline differences—drive the comparison.",
    html: experiments,
  },
  {
    id: "results",
    number: "04",
    label: "Results",
    title: "The results: no universal winner, but several decisive trade-offs",
    intro:
      "Quality, elapsed time, FLOPs, long-context behavior, and serving throughput answer different questions. Read together, they explain why the model with the lowest loss was not the fastest or the most robust beyond 1K tokens.",
    html: results,
  },
  {
    id: "internals",
    number: "05",
    label: "Internals & engineering",
    title: "Inside the models—and inside the system that made them comparable",
    intro:
      "Representation probes and attention patterns help explain how the recipes differ, while registry-driven construction, streaming data, verified recovery, and frozen publication assets make the evidence reproducible.",
    html: internals,
  },
] as const;

export function CaseStudyPage() {
  const { mode } = useThemeMode();

  return (
    <div className={`main-container case-study-page ${mode}-mode`}>
      <Navigation linkSectionsToHome />
      <main className="case-study-shell">
        <article
          id="transformer-case-study"
          className="tvc"
          data-asset-version={CASE_STUDY_ASSET_VERSION}
          data-summary-url={caseStudyAssets.summary}
          data-internals-url={caseStudyAssets.internals}
          data-retrieval-url={caseStudyAssets.retrieval}
          data-routing-url={caseStudyAssets.routing}
          data-attention-index-url={caseStudyAssets.attentionIndex}
          data-attention-base-url={caseStudyAssets.attentionBase}
        >
          <header className="tvc-series-header">
            <div className="tvc-series-identity">
              <a href="/">Avinash Singh</a>
              <span>50 runs · 5 seeds · 25B processed training tokens</span>
            </div>
            <div className="tvc-chapter-hero">
              <div>
                <p className="tvc-eyebrow">Long-form research case study</p>
                <h1>
                  Transformer Variants: what changed, what improved, and what it cost
                </h1>
                <p className="tvc-lede">
                  A five-seed comparison of ten approximately
                  50M-active-parameter decoder recipes across prediction quality,
                  long-context extrapolation, throughput, internal representations,
                  routing, and operational reliability.
                </p>
              </div>
              <img
                data-case-asset
                className="tvc-hero-visual"
                src="/assets/transformer-variants/thumbnail.svg"
                alt="Dense, local, linear, and mixture-of-experts Transformer paths leading to a quality-versus-throughput comparison"
              />
            </div>
            <nav
              className="tvc-chapter-nav"
              aria-label="Transformer Variants case-study chapters"
            >
              {chapters.map((chapter) => (
                <a
                  className="tvc-chapter-link"
                  href={`#${chapter.id}`}
                  data-chapter={chapter.id}
                  key={chapter.id}
                >
                  <span>{chapter.number}</span>
                  <strong>{chapter.label}</strong>
                </a>
              ))}
            </nav>
          </header>

          <div className="tvc-chapter-content">
            {chapters.map((chapter) => (
              <section
                className="tvc-consolidated-chapter"
                id={chapter.id}
                key={chapter.id}
              >
                {chapter.id === "overview" ? null : (
                  <header className="tvc-consolidated-heading tvc-reading-width">
                    <p className="tvc-section-kicker">
                      Chapter {chapter.number} · {chapter.label}
                    </p>
                    <h2>{chapter.title}</h2>
                    <p className="tvc-chapter-intro">{chapter.intro}</p>
                  </header>
                )}
                <div dangerouslySetInnerHTML={{ __html: chapter.html }} />
              </section>
            ))}
          </div>

          <footer className="tvc-provenance">
            <div>
              <strong>Reproducible snapshot</strong>
              <p>
                Metrics and visual assets are frozen from the pinned
                TransformerVariants source commit recorded in the interactive data
                bundle; unsupported states remain explicit rather than being
                converted into zeros.
              </p>
            </div>
            <a
              className="tvc-primary-action"
              data-source-commit-link
              href="https://github.com/avsngh-git/TransformerVariants"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="View source repository"
            >
              View source <span data-source-commit-label>repository</span>
            </a>
          </footer>
          <CaseStudyRuntime />
        </article>
      </main>
      <Footer />
    </div>
  );
}
