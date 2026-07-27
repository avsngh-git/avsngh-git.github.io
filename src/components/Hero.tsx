import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

import { portfolio } from "../content/portfolio";

function SocialLinks({ className }: { className: string }) {
  return (
    <div className={className}>
      <a
        href={portfolio.links.github}
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub profile"
      >
        <GitHubIcon />
      </a>
      <a
        href={portfolio.links.linkedin}
        target="_blank"
        rel="noreferrer"
        aria-label="LinkedIn profile"
      >
        <LinkedInIcon />
      </a>
    </div>
  );
}

export function Hero() {
  return (
    <header className="container hero-container">
      <div className="about-section">
        <div className="image-wrapper">
          <img src={portfolio.imageUrl} alt={`${portfolio.name} profile`} />
        </div>
        <div className="content">
          <SocialLinks className="social_icons" />
          <h1>{portfolio.name}</h1>
          <p>{portfolio.headline}</p>
          <div className="hero-actions">
            <a className="primary-action" href="#projects">
              View selected work
            </a>
            <a
              className="secondary-action"
              href={portfolio.resumeUrl}
              target="_blank"
              rel="noreferrer"
            >
              View résumé
            </a>
          </div>
          <SocialLinks className="mobile_social_icons" />
        </div>
      </div>
    </header>
  );
}
