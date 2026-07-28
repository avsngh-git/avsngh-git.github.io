import { fireEvent, render, screen, within } from "@testing-library/react";

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
        name: /Transformer Variants: which efficiency claims/i,
      }),
    ).toBeInTheDocument();
    const chapterNavigation = screen.getByRole("navigation", {
      name: /case-study chapters/i,
    });
    for (const chapter of [
      "Why this study",
      "Meet the variants",
      "How it was tested",
      "What happened",
      "What it means",
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
    expect(container.textContent).toMatch(/learned position vectors/i);
    expect(container.textContent).toMatch(
      /Ten Transformer recipes, explained before they are compared/,
    );
    expect(container.textContent).toMatch(
      /Start with the baseline, then change one idea at a time/,
    );
    expect(container.textContent).toMatch(
      /How the comparison keeps architecture/,
    );
    expect(container.textContent).toMatch(
      /What happened when quality, speed, and context were measured separately/,
    );
    expect(container.textContent).toMatch(
      /What the evidence supports/,
    );
    expect(container.textContent).toMatch(/FineWeb-Edu/);
    expect(container.querySelector("#fixed-data-chart")).toBeInTheDocument();
    expect(container.querySelector("#attention-chart")).toBeInTheDocument();
    expect(container.querySelector("#variant-comparison")).toBeInTheDocument();
    expect(container.innerHTML).not.toMatch(/\{[%{]/);
  });

  it("explains all variants through keyboard-accessible tabs", () => {
    render(
      <ThemeProvider>
        <CaseStudyPage />
      </ThemeProvider>,
    );

    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(10);
    expect(tabs[0]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      /familiar reference point/i,
    );

    fireEvent.keyDown(tabs[0], { key: "ArrowRight" });
    expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      /current dense Transformer stack/i,
    );

    fireEvent.keyDown(tabs[1], { key: "End" });
    expect(tabs[9]).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      /experts are more valuable/i,
    );
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
