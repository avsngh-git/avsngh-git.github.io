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
    expect(screen.getByText(/The largest recorded improvement followed a bundled move/)).toBeInTheDocument();
    expect(screen.getByText(/The renewal makes the experiment easier to verify/)).toBeInTheDocument();
    expect(screen.getByText(/forecast the next 16 days/)).toBeInTheDocument();
    expect(screen.getByText(/January 1 in 2013–2017/)).toBeInTheDocument();
    expect(screen.getByText(/33 family-level models/)).toBeInTheDocument();
    expect(screen.getByText(/may\s+therefore be optimistic/)).toBeInTheDocument();
    expect(screen.getByText(/transform is deterministic/i)).toBeInTheDocument();
    expect(screen.getByText(/was applied through the full-series pipeline/i)).toBeInTheDocument();
    expect(screen.getByText(/drop_before="2015-01-01"/)).toBeInTheDocument();
    expect(screen.getByText(/output_chunk_length=1/)).toBeInTheDocument();
    expect(screen.getByText(/recursive rollout/)).toBeInTheDocument();
    expect(screen.getByText(/2017-07-31 through 2017-08-15/)).toBeInTheDocument();
    expect(screen.getByText(/reduce training time across 1,782 series/)).toBeInTheDocument();
    expect(screen.getByText(/not a 33.725% sales error/)).toBeInTheDocument();
    expect(screen.getByText(/best of multiple configurations tested on the same holdout/)).toBeInTheDocument();
    expect(screen.getByText(/not an independent final estimate/)).toBeInTheDocument();
    expect(screen.getByText(/untuned comparison/)).toBeInTheDocument();
    expect(screen.getAllByText(/0\.33628/)).toHaveLength(2);
    expect(screen.getByText(/Renewed workflow/)).toBeInTheDocument();
    expect(screen.getByText(/Historical notebook reproduction/)).toBeInTheDocument();
    expect(screen.getByText(/sales lags/)).toBeInTheDocument();
    expect(screen.getByText(/1, 7, 14/)).toBeInTheDocument();
    expect(screen.getByText(/neither CLI command reproduces the historical scores/)).toBeInTheDocument();
    expect(screen.getByText(/jupyter notebook notebooks\/legacy\/store-sales-time-series-forecasting\.ipynb/)).toBeInTheDocument();
    expect(screen.getByText(/!kaggle competitions download/)).toBeInTheDocument();
    expect(screen.getByText(/fresh holdout or rolling-origin validation/)).toBeInTheDocument();
    expect(screen.getByText(/\[dev,visualization,modeling\]/)).toBeInTheDocument();
    expect(screen.getByText(/--model linear-lag/)).toBeInTheDocument();
    expect(screen.getByText(/0\.02987, about an 8\.1% relative reduction/)).toBeInTheDocument();
    expect(screen.getByText(/four lag windows, and ensemble averaging/)).toBeInTheDocument();
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
