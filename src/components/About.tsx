import { portfolio } from "../content/portfolio";

export function About() {
  return (
    <section className="items-container about-copy" id="about">
      <p className="section-kicker">Profile</p>
      <h2>About</h2>
      <p>{portfolio.about}</p>
    </section>
  );
}
