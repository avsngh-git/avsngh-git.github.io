import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { useThemeMode } from "../theme/theme";

const chapters = [
  ["why", "01", "Why this problem"],
  ["decisions", "02", "Why these decisions"],
  ["results", "03", "What the evidence says"],
  ["renewal", "04", "Why rebuild it"],
] as const;

export function FavoritaCaseStudyPage() {
  const { mode } = useThemeMode();

  return (
    <div className={`main-container ${mode}-mode favorita-case-study-page`}>
      <Navigation linkSectionsToHome />
      <main className="fsc-shell">
        <article className="fsc" data-testid="favorita-case-study">
          <header className="fsc-header">
            <div className="fsc-identity">
              <a href="/">Avinash Singh</a>
              <span>Retail forecasting · code-first rebuild</span>
            </div>
            <div className="fsc-hero">
              <div>
                <p className="fsc-eyebrow">Portfolio case study</p>
                <h1>Favorita Store Sales Forecasting</h1>
                <p className="fsc-lede">
                  A competition notebook became a question about trust: can a
                  demand forecast be strong enough to discuss, and structured
                  enough for another engineer to inspect?
                </p>
                <div className="fsc-actions">
                  <a
                    className="fsc-primary-action"
                    href="https://github.com/avsngh-git/Favorita-store-sales-prediction"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View source repository
                  </a>
                  <a className="fsc-secondary-action" href="#results">
                    Jump to evidence
                  </a>
                </div>
              </div>
              <img
                className="fsc-hero-figure"
                src="/assets/favorita-store-sales/pipeline.svg"
                alt="Forecasting workflow from retail data through validation to inspectable artifacts"
              />
            </div>
            <nav className="fsc-chapter-nav" aria-label="Favorita case-study chapters">
              {chapters.map(([id, number, label]) => (
                <a href={`#${id}`} key={id}>
                  <span>{number}</span>
                  <strong>{label}</strong>
                </a>
              ))}
            </nav>
          </header>

          <section className="fsc-section fsc-reading" id="why">
            <p className="fsc-kicker">Chapter 01 · Why this problem</p>
            <h2>Forecasting groceries is a data problem before it is a model problem.</h2>
            <p>
              The dataset contains roughly three million records across 54 stores
              and 33 product families: 1,782 related demand series. That scale is
              large enough to make manual forecasting unrealistic, but the real
              difficulty is that demand is entangled with the way the business
              operates.
            </p>
            <p>
              Christmas dates disappear because stores may be closed. Oil prices
              disappear on trading holidays and weekends. Transactions are absent
              when a store has no recorded sales. Promotions and holidays can look
              like ordinary calendar effects unless they are joined deliberately.
              Each choice changes what the model is allowed to learn, so I treated
              preprocessing as part of the forecasting argument rather than as
              invisible cleanup.
            </p>
            <div className="fsc-metrics" aria-label="Project scale and evaluation metrics">
              <div><strong>~3M</strong><span>historical records</span></div>
              <div><strong>1,782</strong><span>store–family series</span></div>
              <div><strong>RMSLE</strong><span>relative-error objective</span></div>
              <div><strong>16 days</strong><span>chronological holdout</span></div>
            </div>
          </section>

          <section className="fsc-section" id="decisions">
            <div className="fsc-reading">
              <p className="fsc-kicker">Chapter 02 · Why these decisions</p>
              <h2>The modeling ladder makes improvement explainable.</h2>
              <p>
                I did not start with the most complicated model available. A
                seasonal baseline establishes what “predict next week like last
                week” can already achieve. A linear model tests whether calendar
                and lag relationships are enough. LightGBM then earns its place by
                capturing nonlinear interactions between demand, promotion, store,
                and time.
              </p>
              <p>
                The original experiment compared several lag windows and averaged
                their forecasts. That ensemble is motivated by the structure of
                retail demand: a seven-day pattern can coexist with slower annual
                or assortment effects. The point is not that more models are always
                better; it is that each additional model should answer a specific
                uncertainty about the data.
              </p>
            </div>
            <figure className="fsc-figure fsc-figure-wide">
              <img
                src="/assets/favorita-store-sales/pipeline.svg"
                alt="Pipeline showing data decisions, lag features, temporal validation, models, and artifacts"
              />
              <figcaption>
                The rebuilt workflow makes the reasoning visible: every forecast
                passes through a temporal split, and every run leaves behind a
                metric file and row-level predictions.
              </figcaption>
            </figure>
          </section>

          <section className="fsc-section" id="results">
            <div className="fsc-reading">
              <p className="fsc-kicker">Chapter 03 · What the evidence says</p>
              <h2>The result is useful because its provenance is part of the result.</h2>
              <p>
                The legacy notebook recorded a meaningful improvement from the
                linear baseline to the LightGBM ensemble. It also reported a top-4%
                public Kaggle position. Those are valuable signals, but they are
                not interchangeable measurements: local validation and leaderboard
                scoring use different contexts.
              </p>
            </div>
            <figure className="fsc-figure fsc-benchmark-figure">
              <img
                src="/assets/favorita-store-sales/benchmark.svg"
                alt="Bar chart of notebook-recorded RMSLE values for linear regression, LightGBM ensembles, and a historical Kaggle submission"
              />
              <figcaption>
                Lower is better. Values are recorded in the legacy notebook or its
                competition record and are explicitly not presented as a fresh
                rerun of the rebuilt package.
              </figcaption>
            </figure>
            <div className="fsc-result-table-wrap">
              <table className="fsc-result-table">
                <caption>Recorded results and what they mean</caption>
                <thead>
                  <tr><th>Experiment</th><th>RMSLE</th><th>Interpretation</th></tr>
                </thead>
                <tbody>
                  <tr><td>Linear Regression</td><td>0.36712</td><td>Baseline from the notebook’s chronological holdout</td></tr>
                  <tr><td>LightGBM ensemble</td><td>0.33725</td><td>Different lag windows averaged to reduce model-specific error</td></tr>
                  <tr><td>Tuned ensemble</td><td>0.33667</td><td>Small additional gain after manual parameter comparison</td></tr>
                  <tr><td>Kaggle submission</td><td>0.38202</td><td>Historical public score; rank 25 of approximately 650</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="fsc-section" id="renewal">
            <div className="fsc-reading">
              <p className="fsc-kicker">Chapter 04 · Why rebuild it</p>
              <h2>The renewal is about making the work inspectable, not making it look newer.</h2>
              <p>
                A 3 MB notebook can contain excellent reasoning and still be a poor
                code-review surface. Its state is hidden in execution order, its
                environment is implicit, and its important claims are difficult to
                separate from exploratory output. That is why the notebook now
                lives as a legacy research record rather than the project’s main
                interface.
              </p>
              <p>
                The rebuilt repository exposes data validation, feature generation,
                seasonal and linear models, chronological evaluation, plotting, and
                artifact writing as named modules. A visitor can run a baseline with
                one command, inspect the tests that guard against target leakage,
                and see exactly where the original Darts/LightGBM pipeline still
                needs to be extracted.
              </p>
            </div>
            <div className="fsc-code-grid">
              <div>
                <p className="fsc-code-label">Run the inspectable workflow</p>
                <pre><code>{`python -m pip install -e ".[dev,visualization]"
python -m favorita_forecasting \
  --data-dir data \
  --output-dir artifacts \
  --plots`}</code></pre>
              </div>
              <div>
                <p className="fsc-code-label">Inspect the important seams</p>
                <ul className="fsc-link-list">
                  <li><a href="https://github.com/avsngh-git/Favorita-store-sales-prediction/blob/main/src/favorita_forecasting/data.py" target="_blank" rel="noreferrer">Data loading and schema validation</a></li>
                  <li><a href="https://github.com/avsngh-git/Favorita-store-sales-prediction/blob/main/src/favorita_forecasting/models.py" target="_blank" rel="noreferrer">Forecasting models</a></li>
                  <li><a href="https://github.com/avsngh-git/Favorita-store-sales-prediction/blob/main/src/favorita_forecasting/evaluation.py" target="_blank" rel="noreferrer">Evaluation and artifacts</a></li>
                  <li><a href="https://github.com/avsngh-git/Favorita-store-sales-prediction/tree/main/tests" target="_blank" rel="noreferrer">Tests that define the behavior</a></li>
                </ul>
              </div>
            </div>
          </section>

          <footer className="fsc-footer">
            <div>
              <strong>What I would do next</strong>
              <p>
                Extract the legacy holiday, transaction, oil-price, and store joins
                into the tested workflow, then re-run the LightGBM configuration on
                identical validation dates. The next claim should be earned by a
                reproducible run, not inherited from a notebook cell.
              </p>
            </div>
            <a
              className="fsc-primary-action"
              href="https://github.com/avsngh-git/Favorita-store-sales-prediction"
              target="_blank"
              rel="noreferrer"
            >
              View the source <span aria-hidden="true">↗</span>
            </a>
          </footer>
        </article>
      </main>
      <Footer />
    </div>
  );
}
