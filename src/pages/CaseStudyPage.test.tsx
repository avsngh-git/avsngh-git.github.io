import { render, screen, within } from "@testing-library/react";

import { ThemeProvider } from "../theme/ThemeContext";
import { CaseStudyPage } from "./CaseStudyPage";

vi.mock("../features/transformer-variants/CaseStudyRuntime", () => ({
  CaseStudyRuntime: () => null,
}));

describe("Transformer Variants case-study page", () => {
  it("consolidates all five complete chapters into one navigable route", () => {
    const { container } = render(
      <ThemeProvider>
        <CaseStudyPage />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Transformer Variants: what changed/i,
      }),
    ).toBeInTheDocument();
    const chapterNavigation = screen.getByRole("navigation", {
      name: /case-study chapters/i,
    });
    for (const chapter of [
      "Overview",
      "Architecture",
      "Experimental design",
      "Results",
      "Internals & engineering",
    ]) {
      expect(
        within(chapterNavigation).getByRole("link", {
          name: new RegExp(chapter, "i"),
        }),
      ).toBeInTheDocument();
    }

    for (const id of ["overview", "architecture", "experiments", "results", "internals"]) {
      expect(container.querySelector(`#${id}`)).toBeInTheDocument();
    }
    expect(container.textContent).toMatch(/Learned absolute positions/);
    expect(container.textContent).toMatch(
      /The architectural choices, compared mechanism by mechanism/,
    );
    expect(container.textContent).toMatch(
      /Learned positions, RoPE, ALiBI, full attention, GQA, sliding windows/,
    );
    expect(container.textContent).toMatch(
      /A fair comparison is an experimental system, not a leaderboard/,
    );
    expect(container.textContent).toMatch(
      /The results: no universal winner, but several decisive trade-offs/,
    );
    expect(container.textContent).toMatch(
      /Inside the models—and inside the system that made them comparable/,
    );
    expect(container.textContent).toMatch(/FineWeb-Edu/);
    expect(container.querySelector("#fixed-data-chart")).toBeInTheDocument();
    expect(container.querySelector("#attention-chart")).toBeInTheDocument();
    expect(container.querySelector("#variant-comparison")).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/\{[%{]/);
  });

  it("retains source provenance and local interactive assets", () => {
    const { container } = render(
      <ThemeProvider>
        <CaseStudyPage />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("link", { name: /view source repository/i }),
    ).toHaveAttribute("href", "https://github.com/avsngh-git/TransformerVariants");
    expect(container.querySelector("#transformer-case-study")).toHaveAttribute(
      "data-summary-url",
      "/assets/data/transformer-variants/summary.json",
    );
  });
});
