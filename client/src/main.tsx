import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { SmartFleetSimulationProvider } from "./context/SmartFleetSimulationContext";
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SmartFleetSimulationProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL || '/'}>
            <App />
          </BrowserRouter>
        </SmartFleetSimulationProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
