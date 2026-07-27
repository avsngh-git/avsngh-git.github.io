import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

import { portfolio } from "../content/portfolio";

export function Footer() {
  return (
    <footer>
      <div>
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
      <p>
        © {new Date().getFullYear()} {portfolio.name}. Template adapted from{" "}
        <a
          href="https://github.com/yujisatojr/react-portfolio-template"
          target="_blank"
          rel="noreferrer"
        >
          Yuji Sato’s React Portfolio Template
        </a>
        .
      </p>
    </footer>
  );
}
