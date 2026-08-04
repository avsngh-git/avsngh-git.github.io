import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ThemeProvider } from "../theme/ThemeContext";
import { HomePage } from "./HomePage";

function renderHome() {
  return render(
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>,
  );
}

describe("portfolio homepage", () => {
  it("renders the real template sections and direct contact actions", () => {
    renderHome();

    expect(
      screen.getByRole("heading", { level: 1, name: "Avinash Singh" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "About" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Expertise" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Career History" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Selected Projects" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Contact" })).toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /email me/i })).toHaveAttribute(
      "href",
      expect.stringMatching(/^mailto:/),
    );
  });

  it("links the project card to the dedicated case-study route", () => {
    renderHome();

    const projects = screen.getByTestId("projects");
    expect(
      within(projects).getByRole("link", {
        name: /read transformer variants case study/i,
      }),
    ).toHaveAttribute("href", "/projects/transformer-variants/");
    expect(
      within(projects).getByRole("link", {
        name: /read favorita store sales forecasting case study/i,
      }),
    ).toHaveAttribute("href", "/projects/favorita-store-sales/");
  });

  it("toggles theme through an accessible navigation control", async () => {
    const user = userEvent.setup();
    renderHome();

    const toggle = screen.getByRole("button", { name: /switch to light theme/i });
    await user.click(toggle);

    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(
      screen.getByRole("button", { name: /switch to dark theme/i }),
    ).toBeInTheDocument();
  });
});
