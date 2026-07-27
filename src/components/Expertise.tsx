import { faBrain, faChartLine, faFlask } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Chip from "@mui/material/Chip";

import { portfolio, type Expertise as ExpertiseItem } from "../content/portfolio";

const icons = {
  statistics: faChartLine,
  "machine-learning": faBrain,
  research: faFlask,
} satisfies Record<ExpertiseItem["icon"], typeof faChartLine>;

export function Expertise() {
  return (
    <section className="container section-container" id="expertise">
      <div className="skills-container">
        <p className="section-kicker">Methods & tools</p>
        <h2>Expertise</h2>
        <div className="skills-grid">
          {portfolio.expertise.map((item) => (
            <article className="skill" key={item.title}>
              <FontAwesomeIcon icon={icons[item.icon]} size="3x" />
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              <div className="flex-chips" aria-label={`${item.title} skills`}>
                {item.skills.map((skill) => (
                  <Chip className="chip" key={skill} label={skill} />
                ))}
              </div>
            </article>
          ))}
        </div>
        <div className="proficiency-section">
          <h3>Core proficiency</h3>
          <div className="proficiency-grid">
            {portfolio.proficiencies.map((proficiency) => (
              <div className="proficiency" key={proficiency.name}>
                <div className="proficiency-label">
                  <span>{proficiency.name}</span>
                  <strong>{proficiency.percentage}%</strong>
                </div>
                <div
                  className="proficiency-track"
                  role="progressbar"
                  aria-label={proficiency.name}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={proficiency.percentage}
                >
                  <span style={{ width: `${proficiency.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
