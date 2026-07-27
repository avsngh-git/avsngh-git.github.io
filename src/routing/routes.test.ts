import { legacyRedirects, resolvePage } from "./routes";

describe("public routes", () => {
  it("resolves the homepage and dedicated case-study route", () => {
    expect(resolvePage("/")).toBe("home");
    expect(resolvePage("/projects/transformer-variants")).toBe("case-study");
    expect(resolvePage("/projects/transformer-variants/")).toBe("case-study");
  });

  it("maps every retired Jekyll route to a stable destination", () => {
    expect(legacyRedirects["/about/"]).toBe("/#about");
    expect(legacyRedirects["/projects/"]).toBe("/#projects");
    expect(legacyRedirects["/projects/transformer-variants.html"]).toBe(
      "/projects/transformer-variants/",
    );
    expect(legacyRedirects["/projects/transformer-variants/results/"]).toBe(
      "/projects/transformer-variants/#results",
    );
    expect(legacyRedirects["/projects/transformer-variants/internals/"]).toBe(
      "/projects/transformer-variants/#internals",
    );
  });
});
