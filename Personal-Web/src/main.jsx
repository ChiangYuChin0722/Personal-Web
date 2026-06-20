import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import SecretPage from "./pages/SecretPage.jsx";
import FunPage from "./pages/FunPage.jsx";
import FriendPage from "./pages/FriendPage.jsx";
import USStockPage from "./pages/USStockPage.jsx";
import ProjectPage from "./pages/ProjectPage.jsx";
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
let Page = Chiangverse;
if (path.startsWith("/dashboard/fun")) Page = FunPage;
else if (path.startsWith("/dashboard/friend")) Page = FriendPage;
else if (path.startsWith("/dashboard")) Page = SecretPage;
else if (path.toLowerCase().startsWith("/usstock")) Page = USStock;
else if (path.toLowerCase().startsWith("/project")) Page = ProjectPage;
else if (path.toLowerCase().startsWith("/cv") || path.toLowerCase().startsWith("/home"))
  Page = App;

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
