import EmailIcon from "@mui/icons-material/Email";
import GitHubIcon from "@mui/icons-material/GitHub";
import LinkedInIcon from "@mui/icons-material/LinkedIn";

import { portfolio } from "../content/portfolio";

export function Contact() {
  return (
    <section id="contact">
      <div className="items-container contact_wrapper">
        <p className="section-kicker">Get in touch</p>
        <h2>Contact</h2>
        <p>
          For opportunities and conversations around statistical modeling, machine
          learning research, or robust data systems, reach me directly.
        </p>
        <div className="contact-actions">
          <a className="primary-action" href={portfolio.links.email}>
            <EmailIcon /> Email me
          </a>
          <a href={portfolio.links.linkedin} target="_blank" rel="noreferrer">
            <LinkedInIcon /> LinkedIn
          </a>
          <a href={portfolio.links.github} target="_blank" rel="noreferrer">
            <GitHubIcon /> GitHub
          </a>
        </div>
      </div>
    </section>
  );
}
