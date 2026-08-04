import { render, screen, within } from "@testing-library/react";

import { ThemeProvider } from "../theme/ThemeContext";
import { FavoritaCaseStudyPage } from "./FavoritaCaseStudyPage";

describe("Favorita Store Sales case-study page", () => {
  it("explains the objective, methods, evidence, and renewal in one page", () => {
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
    expect(screen.getByText(/First define the decision/)).toBeInTheDocument();
    expect(screen.getByText(/The model ladder asks what each extra technique buys/)).toBeInTheDocument();
    expect(screen.getByText(/The largest gain came from changing the model family/)).toBeInTheDocument();
    expect(screen.getByText(/The renewal makes the experiment easier to verify/)).toBeInTheDocument();
    expect(screen.getByText(/forecast the next 16 days/)).toBeInTheDocument();
    expect(screen.getByText(/0.02987, about an 8.1% relative reduction/)).toBeInTheDocument();
    expect(screen.getByText(/Historical Kaggle result: 0.38202/)).toBeInTheDocument();

    const navigation = screen.getByRole("navigation", {
      name: /Favorita case-study chapters/i,
    });
    expect(within(navigation).getAllByRole("link")).toHaveLength(4);
    expect(screen.getByRole("img", { name: /forecasting workflow/i })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /bar chart of same-holdout/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view source repository/i })).toHaveAttribute(
      "href",
      "https://github.com/avsngh-git/Favorita-store-sales-prediction",
    );
  });
});
