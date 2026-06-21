import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import SecretPage from "./pages/SecretPage.jsx";
import FunPage from "./pages/FunPage.jsx";
import FriendPage from "./pages/FriendPage.jsx";
import USStockPage from "./pages/USStockPage.jsx";
import ProjectPage from "./pages/ProjectPage.jsx";
import NotFound from "./pages/NotFound.jsx";
import { LangProvider } from "./pages/usstock/lang.jsx";

// Three.js is heavy — load the Chiangverse (the 3D galaxy homepage) lazily as its own chunk.
const Chiangverse = lazy(() => import("./pages/ChiangversePage.jsx"));
import "./styles/globals.css";
import "./styles/theme.css";

const path = window.location.pathname;

const USStock = () => (
  <LangProvider>
    <USStockPage />
  </LangProvider>
);

// The Chiangverse galaxy IS the homepage. The classic CV/portfolio site lives at /cv.
const lp = path.toLowerCase();
let Page;
if (path.startsWith("/dashboard/fun")) Page = FunPage;
else if (path.startsWith("/dashboard/friend")) Page = FriendPage;
else if (path.startsWith("/dashboard")) Page = SecretPage;
else if (lp.startsWith("/usstock")) Page = USStock;
else if (lp.startsWith("/project")) Page = ProjectPage;
else if (lp.startsWith("/cv") || lp.startsWith("/home")) Page = App;
else if (path === "/" || path === "" || lp === "/index.html") Page = Chiangverse;
else Page = NotFound; // unknown route → space-themed 404

const loadingFallback = (
  <div
    style={{
      position: "fixed",
      inset: 0,
      background: "#050816",
      color: "#8aa0ff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "-apple-system, system-ui, sans-serif",
      fontSize: 14,
      letterSpacing: 2,
    }}
  >
    進入宇宙中… entering the Chiangverse
  </div>
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Suspense fallback={loadingFallback}>
      <Page />
    </Suspense>
  </React.StrictMode>
);
