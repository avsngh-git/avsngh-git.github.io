import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { App } from "./App";
import "./styles/global.scss";
import { ThemeProvider } from "./theme/ThemeContext";

const root = document.getElementById("root");
if (!root) throw new Error("Portfolio root element was not found.");

createRoot(root).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);
