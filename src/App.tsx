import { lazy, Suspense } from "react";

import { resolvePage } from "./routing/routes";

const HomePage = lazy(async () => {
  const module = await import("./pages/HomePage");
  return { default: module.HomePage };
});

const CaseStudyPage = lazy(async () => {
  const module = await import("./pages/CaseStudyPage");
  return { default: module.CaseStudyPage };
});

const FavoritaCaseStudyPage = lazy(async () => {
  const module = await import("./pages/FavoritaCaseStudyPage");
  return { default: module.FavoritaCaseStudyPage };
});

function LoadingPage() {
  return (
    <main className="route-loading" aria-live="polite">
      Loading…
    </main>
  );
}

function NotFoundPage() {
  return (
    <main className="not-found-page">
      <p className="section-kicker">404</p>
      <h1>That page is not part of this portfolio.</h1>
      <a className="primary-action" href="/">
        Return home
      </a>
    </main>
  );
}

export function App() {
  const page = resolvePage(window.location.pathname);

  return (
    <Suspense fallback={<LoadingPage />}>
      {page === "home" ? <HomePage /> : null}
      {page === "case-study" ? <CaseStudyPage /> : null}
      {page === "favorita-case-study" ? <FavoritaCaseStudyPage /> : null}
      {page === "not-found" ? <NotFoundPage /> : null}
    </Suspense>
  );
}
