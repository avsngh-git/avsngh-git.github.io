import redirectEntries from "../../redirects.json";

export type Page = "home" | "case-study" | "favorita-case-study" | "not-found";

export const CASE_STUDY_PATH = "/projects/transformer-variants/";
export const FAVORITA_CASE_STUDY_PATH = "/projects/favorita-store-sales/";

type RedirectEntry = {
  source: string;
  target: string;
};

export const legacyRedirects: Readonly<Record<string, string>> =
  Object.fromEntries(
    (redirectEntries as RedirectEntry[]).map(({ source, target }) => [
      source,
      target,
    ]),
  );

function normalizePath(pathname: string) {
  if (pathname === "/") return pathname;
  return `/${pathname.split("/").filter(Boolean).join("/")}/`;
}

export function resolvePage(pathname: string): Page {
  const normalized = normalizePath(pathname);
  if (normalized === "/") return "home";
  if (normalized === CASE_STUDY_PATH) return "case-study";
  if (normalized === FAVORITA_CASE_STUDY_PATH) return "favorita-case-study";
  return "not-found";
}
