import { render, screen, within } from "@testing-library/react";

import { ThemeProvider } from "../theme/ThemeContext";
import { FavoritaCaseStudyPage } from "./FavoritaCaseStudyPage";

describe("Favorita Store Sales case-study page", () => {
  it("explains the motivations, evidence, and renewal in one page", () => {
    render(
      <ThemeProvider>
        <FavoritaCaseStudyPage />
      </ThemeProvider>,
    );

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "Favorita Store Sales Forecasting",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Forecasting groceries is a data problem/)).toBeInTheDocument();
    expect(screen.getByText(/The modeling ladder makes improvement explainable/)).toBeInTheDocument();
    expect(screen.getByText(/The result is useful because its provenance/)).toBeInTheDocument();
    expect(screen.getByText(/The renewal is about making the work inspectable/)).toBeInTheDocument();

    const navigation = screen.getByRole("navigation", {
      name: /Favorita case-study chapters/i,
    });
    expect(within(navigation).getAllByRole("link")).toHaveLength(4);
    expect(screen.getByRole("img", { name: /forecasting workflow/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /bar chart of/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view source repository/i })).toHaveAttribute(
      "href",
      "https://github.com/avsngh-git/Favorita-store-sales-prediction",
    );
  });
});
