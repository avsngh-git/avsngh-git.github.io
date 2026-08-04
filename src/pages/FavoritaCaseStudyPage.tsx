import { Footer } from "../components/Footer";
import { Navigation } from "../components/Navigation";
import { useThemeMode } from "../theme/theme";

const chapters = [
  ["objective", "01", "Objective and data"],
  ["methods", "02", "How the forecast was built"],
  ["results", "03", "What improved"],
  ["inspectable", "04", "How I made it inspectable"],
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
              <span>Historical Kaggle experiment · code-first rebuild</span>
            </div>
            <div className="fsc-hero">
              <div>
                <p className="fsc-eyebrow">Portfolio case study</p>
                <h1>Favorita Store Sales Forecasting</h1>
                <p className="fsc-lede">
                  The objective was to forecast the next 16 days of daily sales
                  for 33 product families across 54 grocery stores: 1,782 related
                  store–family series. The forecast is useful because a retailer
                  needs to anticipate demand before replenishment and promotion
                  decisions are made. Under-forecasting can contribute to
                  stockouts; over-forecasting can leave inventory sitting on
                  shelves.
                </p>
                <p className="fsc-lede fsc-lede-secondary">
                  The original work lived in a large competition notebook. I then
                  rebuilt its reusable pieces as tested Python modules so the
                  assumptions, validation boundary, and generated artifacts could
                  be inspected separately from exploratory code. The historical
                  Darts/LightGBM result and the renewed baseline are therefore
                  described as two related, but not yet identical, workflows.
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

          <section className="fsc-section fsc-reading" id="objective">
            <p className="fsc-kicker">Chapter 01 · Objective and data</p>
            <h2>First define the decision: estimate demand before the store has seen it.</h2>
            <p>
              Each training row represents sales for one product family in one
              store on one day. The model uses historical sales and covariates to
              estimate the following 16 days across all 1,782 store–family series.
              This is a multi-series forecasting problem: the stores share broad
              patterns, but each series has its own scale, product mix, and local
              response to promotions.
            </p>
            <p>
              The dataset has roughly three million records. At this scale, the
              challenge is not only choosing a model; it is deciding which signals
              are real, which gaps represent closures, and which values would
              genuinely be available when a forecast is produced.
            </p>
            <h3>Why RMSLE was the objective</h3>
            <p>
              RMSLE compares <code>log(1 + actual sales)</code> with
              <code>log(1 + predicted sales)</code>. Lower is better. The log
              transform makes the metric respond more to proportional mistakes
              than to raw-unit mistakes, so the largest stores do not completely
              determine the score and zero-heavy product families remain part of
              the evaluation.
            </p>
            <div className="fsc-metrics" aria-label="Project scale and evaluation metrics">
              <div><strong>~3M</strong><span>historical daily records</span></div>
              <div><strong>54 × 33</strong><span>stores × product families</span></div>
              <div><strong>16 days</strong><span>forecast horizon</span></div>
              <div><strong>1 holdout</strong><span>recorded local evaluation</span></div>
            </div>
            <h3>Data decisions were modeling decisions</h3>
            <p>
              Cleaning was designed around the question “what should this row mean
              at prediction time?” The table records the treatment and the reason
              for it, rather than presenting preprocessing as neutral housekeeping.
            </p>
            <div className="fsc-table-wrap">
              <table className="fsc-explanation-table">
                <caption>Data problem, treatment, and motivation</caption>
                <thead>
                  <tr><th>Data problem</th><th>Treatment</th><th>Motivation</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Missing Christmas and New Year records</td>
                    <td>Temporarily treated as missing and interpolated</td>
                    <td>A closure should not be learned as permanent zero demand.</td>
                  </tr>
                  <tr>
                    <td>Weekend and holiday gaps in oil prices</td>
                    <td>Linearly interpolated</td>
                    <td>Oil is a daily covariate, while its source follows trading days.</td>
                  </tr>
                  <tr>
                    <td>Incomplete transaction records</td>
                    <td>Zero-filled where no record indicated no sales; remaining gaps interpolated</td>
                    <td>Separate a genuine no-transaction signal from an incomplete data feed.</td>
                  </tr>
                  <tr>
                    <td>Promotions and holidays</td>
                    <td>Joined as time-varying covariates</td>
                    <td>Demand spikes need business context beyond weekday and month.</td>
                  </tr>
                  <tr>
                    <td>Persistent differences between stores</td>
                    <td>Store type, city, state, and cluster used as static covariates</td>
                    <td>Store metadata helps the model distinguish local baseline demand.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h3>What was assumed to be known in the future?</h3>
            <p>
              Promotions and holidays were treated as future-known information:
              their schedules can be provided when planning the next 16 days.
              Transactions were treated as past-only because tomorrow’s transaction
              count is not available when tomorrow’s forecast is generated. Oil was
              supplied as a future covariate in the competition data; in a real
              deployment, that would require an oil-price forecast or an external
              planning estimate rather than hindsight.
            </p>
          </section>

          <section className="fsc-section" id="methods">
            <div className="fsc-reading">
              <p className="fsc-kicker">Chapter 02 · How the forecast was built</p>
              <h2>The model ladder asks what each extra technique buys.</h2>
              <p>
                The progression was deliberate. First, a transparent benchmark
                tests whether recent demand and covariates are enough. Then a
                nonlinear model tests whether the data contains interactions that
                would be cumbersome to specify by hand. Finally, multiple temporal
                views are combined to test whether short and long rhythms are
                complementary.
              </p>
              <h3>1. Linear regression: an interpretable reference point</h3>
              <p>
                Linear regression was the first benchmark because it tests a mostly
                additive explanation of sales. It used lagged sales, calendar
                variables, promotions, holidays, transactions, and store metadata.
                If this model performed well, a more complex model would need to
                justify its extra cost with a measurable improvement.
              </p>
              <h3>2. LightGBM: represent nonlinear interactions</h3>
              <p>
                LightGBM was selected because tree ensembles can learn threshold
                effects and interactions. For example, a promotion can matter
                differently by store, product family, weekday, and recent demand
                level. A linear model would need those combinations to be encoded
                manually; LightGBM can discover useful combinations from the data.
              </p>
              <h3>3. Lag windows: expose multiple demand rhythms</h3>
              <p>
                The notebook compared lag windows of 7, 63, 365, and 730 days.
                The seven-day view captures weekly repetition; the longer windows
                provide evidence about recent seasonality and annual or long-cycle
                behavior. These lags are shifted so the target day cannot leak into
                its own features.
              </p>
              <h3>4. Ensemble averaging: let complementary models vote</h3>
              <p>
                The forecasts from the different lag-window models were averaged.
                This is useful only if the models make at least partly different
                errors. In the recorded run, the best individual LightGBM
                configuration scored <code>0.33909</code>, while the ensemble scored
                <code>0.33725</code>. That improvement is evidence of complementarity
                in this holdout, although no error-correlation analysis was run to
                prove the mechanism.
              </p>
              <h3>5. Tuning: test whether parameters add more than complexity</h3>
              <p>
                The final comparison varied <code>num_leaves</code>,
                <code>learning_rate</code>, and <code>min_data_in_leaf</code> while
                keeping the lag-window ensemble structure. This improved the
                recorded score from <code>0.33725</code> to <code>0.33667</code>—a
                small gain, not a major modeling breakthrough.
              </p>
            </div>
            <figure className="fsc-figure fsc-figure-wide">
              <img
                src="/assets/favorita-store-sales/pipeline.svg"
                alt="Pipeline showing data decisions, lag features, temporal validation, models, and artifacts"
              />
              <figcaption>
                Conceptual workflow, not a prediction plot: the point is to show
                where data assumptions, shifted features, temporal validation, and
                artifacts fit in the argument.
              </figcaption>
            </figure>
          </section>

          <section className="fsc-section" id="results">
            <div className="fsc-reading">
              <p className="fsc-kicker">Chapter 03 · What improved</p>
              <h2>The largest gain came from changing the model family; tuning added only a margin.</h2>
              <p>
                The local values below were all recorded on the same chronological
                16-day holdout with one fold. That makes them comparable to one
                another, even though the evaluation is weaker than repeated
                rolling-origin validation would be.
              </p>
            </div>
            <figure className="fsc-figure fsc-benchmark-figure">
              <img
                src="/assets/favorita-store-sales/benchmark.svg"
                alt="Bar chart of same-holdout RMSLE values for linear regression and two LightGBM ensembles"
              />
              <figcaption>
                Same-holdout local validation from the legacy notebook. Lower RMSLE
                is better; this figure intentionally excludes the differently
                scoped Kaggle leaderboard score.
              </figcaption>
            </figure>
            <div className="fsc-result-table-wrap">
              <table className="fsc-result-table">
                <caption>Recorded results on the same 16-day holdout</caption>
                <thead>
                  <tr><th>Experiment</th><th>RMSLE</th><th>What changed and what it means</th></tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Linear regression</td>
                    <td>0.36712</td>
                    <td>Additive lag-and-covariate reference point. It tells us how far a simple, inspectable model gets.</td>
                  </tr>
                  <tr>
                    <td>LightGBM ensemble</td>
                    <td>0.33725</td>
                    <td>Down 0.02987, about an 8.1% relative reduction. Multiple lag windows and nonlinear interactions helped on this holdout.</td>
                  </tr>
                  <tr>
                    <td>Tuned ensemble</td>
                    <td>0.33667</td>
                    <td>Down another 0.00058, about a 0.17% relative reduction. Parameter tuning contributed only a marginal extra gain.</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="fsc-evidence-note">
              <h3>What the improvement explanation can—and cannot—claim</h3>
              <p>
                The results suggest that nonlinear interactions and multiple
                temporal scales were useful: the major recorded change was from a
                linear model to a multi-window LightGBM ensemble. They do not prove
                that either technique caused the entire improvement, because the
                notebook did not run ablations such as LightGBM without lags,
                single-window versus multi-window models, or an error-correlation
                study of the ensemble. The right conclusion is “promising evidence,”
                not “causal proof.”
              </p>
            </div>
            <div className="fsc-kaggle-result">
              <div>
                <p className="fsc-kicker">Separate competition evidence</p>
                <h3>Historical Kaggle result: 0.38202, rank 25 of approximately 650</h3>
              </div>
              <p>
                This score came from the competition’s public leaderboard and uses
                hidden labels, so it is not directly comparable with the local
                holdout values above. It is also historical evidence: the renewed
                package has not reproduced the original submission.
              </p>
            </div>
            <div className="fsc-future-evidence">
              <h3>What a future data-backed diagnostic would show</h3>
              <p>
                No actual-versus-predicted plot is included here because the
                competition data is not available in this portfolio build. With
                the data, the most useful next figures would show one representative
                store–family series across the 16-day holdout and error grouped by
                store or product family. They would reveal whether the aggregate
                gain follows the weekly pattern, misses short-lived promotion
                spikes, or hides uneven performance across the business.
              </p>
            </div>
          </section>

          <section className="fsc-section" id="inspectable">
            <div className="fsc-reading">
              <p className="fsc-kicker">Chapter 04 · How I made it inspectable</p>
              <h2>The renewal makes the experiment easier to verify, not more impressive by association.</h2>
              <p>
                The original notebook mixed data loading, feature construction,
                model configuration, validation, plotting, and submission
                generation in execution order. That made it difficult to answer
                basic questions such as “which rows belong to training?” or “does
                this lag use future sales?” A polished notebook can still be a poor
                code-review surface when its state is hidden in cells and its
                environment is implicit.
              </p>
              <p>
                I separated the reusable concerns into modules for data validation,
                feature generation, models, chronological evaluation, plotting, and
                artifact writing. Tests now guard the most failure-prone boundaries,
                including lag construction, RMSLE inputs, chronological splits, and
                the lightweight end-to-end workflow.
              </p>
              <p className="fsc-strong-note">
                Important boundary: the renewed package currently provides a tested
                lightweight workflow and baseline models. It does not reproduce the
                historical Darts/LightGBM scores shown above; those scores still
                belong to the legacy notebook until the full pipeline is extracted
                and rerun.
              </p>
            </div>
            <div className="fsc-code-grid">
              <div>
                <p className="fsc-code-label">Run the renewed baseline workflow</p>
                <pre><code>{`python -m pip install -e "[dev,visualization]"
python -m favorita_forecasting \
  --data-dir data \
  --output-dir artifacts \
  --plots`}</code></pre>
                <p className="fsc-code-note">
                  Requires the local competition data. This command writes baseline
                  metrics, predictions, and conceptual diagnostic artifacts; it is
                  not the command that produced the historical LightGBM result.
                </p>
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
            <div className="fsc-takeaway">
              <strong>Takeaway</strong>
              <p>
                The original experiment recorded a substantial improvement from a
                linear lag-based benchmark to a multi-window LightGBM ensemble.
                That signal is promising, but it comes from one chronological
                holdout and has not yet been reproduced by the rebuilt package. The
                renewal makes that limitation visible and creates the structure
                needed to verify the result next.
              </p>
            </div>
            <div>
              <strong>What I would do next</strong>
              <p>
                Extract the legacy holiday, transaction, oil-price, and store joins
                into the tested workflow, rerun the LightGBM configuration on
                identical validation dates, and add the ablations needed to explain
                exactly why the score changes.
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
