import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import SecretPage from "./pages/SecretPage.jsx";
import "./styles/globals.css";
import "./styles/theme.css";

const isSecret = window.location.pathname.startsWith("/secret");

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {isSecret ? <SecretPage /> : <App />}
  </React.StrictMode>
);
