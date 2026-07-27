import GitHubIcon from "@mui/icons-material/GitHub";

import { portfolio } from "../content/portfolio";

export function Projects() {
  return (
    <section
      className="projects-container"
      id="projects"
      data-testid="projects"
    >
      <p className="section-kicker">Research & engineering</p>
      <h2>Selected Projects</h2>
      <div className="projects-grid">
        {portfolio.projects.map((project) => {
          const opensNewTab = project.kind === "external";
          return (
            <article className="project" key={project.title}>
              <a
                href={project.href}
                target={opensNewTab ? "_blank" : undefined}
                rel={opensNewTab ? "noreferrer" : undefined}
                aria-label={project.actionLabel}
              >
                <img
                  src={project.image}
                  className="zoom"
                  alt={project.imageAlt}
                />
              </a>
              <div className="project-heading">
                <a
                  href={project.href}
                  target={opensNewTab ? "_blank" : undefined}
                  rel={opensNewTab ? "noreferrer" : undefined}
                >
                  <h3>{project.title}</h3>
                </a>
                <a
                  className="project-source"
                  href={project.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`View ${project.title} source on GitHub`}
                >
                  <GitHubIcon />
                </a>
              </div>
              <p>{project.description}</p>
              <ul className="project-tags" aria-label={`${project.title} tools`}>
                {project.tags.map((tag) => (
                  <li key={tag}>{tag}</li>
                ))}
              </ul>
            </article>
          );
        })}
      </div>
    </section>
  );
}
