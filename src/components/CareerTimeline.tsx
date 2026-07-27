import { faBriefcase, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  VerticalTimeline,
  VerticalTimelineElement,
} from "react-vertical-timeline-component";
import "react-vertical-timeline-component/style.min.css";

import { portfolio } from "../content/portfolio";

export function CareerTimeline() {
  return (
    <section id="history">
      <div className="items-container">
        <p className="section-kicker">Experience & education</p>
        <h2>Career History</h2>
        <VerticalTimeline lineColor="rgba(127, 127, 127, 0.24)">
          {portfolio.timeline.map((entry) => (
            <VerticalTimelineElement
              className={`vertical-timeline-element--${entry.kind}`}
              contentStyle={{ background: "white", color: "rgb(39, 40, 34)" }}
              contentArrowStyle={{ borderRight: "7px solid white" }}
              date={entry.period}
              iconStyle={{ background: "#5000ca", color: "white" }}
              icon={
                <FontAwesomeIcon
                  icon={entry.kind === "work" ? faBriefcase : faGraduationCap}
                />
              }
              key={`${entry.period}-${entry.title}`}
            >
              <h3 className="vertical-timeline-element-title">{entry.title}</h3>
              {entry.organization ? (
                <h4 className="vertical-timeline-element-subtitle">
                  {entry.organization}
                </h4>
              ) : null}
              <p>{entry.description}</p>
            </VerticalTimelineElement>
          ))}
        </VerticalTimeline>
      </div>
    </section>
  );
}
