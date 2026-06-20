import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import SecretPage from "./pages/SecretPage.jsx";
import FunPage from "./pages/FunPage.jsx";
import FriendPage from "./pages/FriendPage.jsx";
import USStockPage from "./pages/USStockPage.jsx";
import "./styles/globals.css";
import "./styles/theme.css";

const path = window.location.pathname;

let Page = App;
if (path.startsWith("/dashboard/fun")) Page = FunPage;
else if (path.startsWith("/dashboard/friend")) Page = FriendPage;
else if (path.startsWith("/dashboard")) Page = SecretPage;
else if (path.toLowerCase().startsWith("/usstock")) Page = USStockPage;

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Page />
  </React.StrictMode>
);
