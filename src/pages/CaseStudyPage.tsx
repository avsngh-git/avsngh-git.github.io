import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import architecture from "../content/transformer-variants/architecture.html?raw";
import experiments from "../content/transformer-variants/experiments.html?raw";
import internals from "../content/transformer-variants/internals.html?raw";
import overview from "../content/transformer-variants/overview.html?raw";
import results from "../content/transformer-variants/results.html?raw";
import { CaseStudyRuntime } from "../features/transformer-variants/CaseStudyRuntime";
import { VariantExplorer } from "../features/transformer-variants/VariantExplorer";
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
    label: "Why this study",
    title: "Why compare Transformer variants under one controlled system?",
    intro:
      "The project separates prediction quality, memory use, training speed, generation speed, and long-context behavior instead of compressing them into one vague claim of efficiency.",
    html: overview,
  },
  {
    id: "architecture",
    number: "02",
    label: "Meet the variants",
    title: "Ten Transformer recipes, explained before they are compared",
    intro:
      "Use the tabs to learn what each recipe changes, why it was included, and which benefit or cost it was designed to test.",
    html: architecture,
  },
  {
    id: "experiments",
    number: "03",
    label: "How it was tested",
    title: "How the comparison keeps architecture—not the pipeline—as the main difference",
    intro:
      "The data, tokenizer, training length, token budget, optimizer, evaluation windows, and uncertainty units are held fixed wherever the architecture permits.",
    html: experiments,
  },
  {
    id: "results",
    number: "04",
    label: "What happened",
    title: "What happened when quality, speed, and context were measured separately",
    intro:
      "The model with the lowest prediction error was not the fastest to train, the fastest to serve, or the most stable beyond the training length.",
    html: results,
  },
  {
    id: "internals",
    number: "05",
    label: "What it means",
    title: "What the evidence supports, how the models differ inside, and where the claims stop",
    intro:
      "Internal probes add context to the behavioral results. Engineering decisions make the evidence reproducible, and explicit limitations keep the conclusions within scope.",
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
                  Transformer Variants: which efficiency claims survive measurement?
                </h1>
                <p className="tvc-lede">
                  Ten small language-model recipes, fifty main training runs, and one
                  controlled system for comparing prediction quality, speed, memory,
                  and behavior beyond the training context.
                </p>
              </div>
              <img
                data-case-asset
                className="tvc-hero-visual"
                src="/assets/transformer-variants/transformer-variants-card.webp"
                alt="Diagram comparing full attention, local attention, linear attention, and routed expert paths"
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
                {chapter.id === "architecture" ? <VariantExplorer /> : null}
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
