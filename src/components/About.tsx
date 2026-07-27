import { portfolio } from "../content/portfolio";

export function About() {
  return (
    <section className="items-container about-copy" id="about">
      <p className="section-kicker">Profile</p>
      <h2>About</h2>
      <p className="about-lede">{portfolio.about}</p>
      {portfolio.aboutDetails.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </section>
  );
}
