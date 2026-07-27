import { portfolio } from "./portfolio";

describe("authoritative portfolio content", () => {
  it("uses Avinash's existing identity and removes all template demo content", () => {
    expect(portfolio.name).toBe("Avinash Singh");
    expect(portfolio.headline).toMatch(/statistician/i);
    expect(JSON.stringify(portfolio)).toMatch(/TRATON|Scania/);
    expect(portfolio.timeline).toHaveLength(4);
    expect(portfolio.proficiencies).toEqual([
      expect.objectContaining({
        name: "Statistical inference & uncertainty quantification",
        percentage: 90,
      }),
      expect.objectContaining({
        name: "Machine learning & deep learning",
        percentage: 85,
      }),
      expect.objectContaining({
        name: "Predictive modeling & model validation",
        percentage: 85,
      }),
      expect.objectContaining({
        name: "Python, SQL & data tooling",
        percentage: 90,
      }),
      expect.objectContaining({
        name: "PyTorch, TensorFlow & Apache Spark",
        percentage: 85,
      }),
      expect.objectContaining({
        name: "Research, analysis & technical communication",
        percentage: 90,
      }),
    ]);
    expect(portfolio.projects.map((project) => project.title)).toContain(
      "Transformer Variants: A Controlled 50-Run Study",
    );
    expect(JSON.stringify(portfolio)).not.toMatch(/Yuji Sato|Filmate AI|High Speed Chase/);
  });

  it("keeps direct contact and résumé actions without a form service", () => {
    expect(portfolio.links.email).toMatch(/^mailto:/);
    expect(portfolio.links.github).toMatch(/^https:\/\/github\.com\//);
    expect(portfolio.links.linkedin).toMatch(/^https:\/\/www\.linkedin\.com\//);
    expect(portfolio.resumeUrl).toBe(
      "/assets/resume/Avi_resume_statisticaldatascience.pdf",
    );
  });
});
