import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.tsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.tsx";
import { SmartFleetSimulationProvider } from "./context/SmartFleetSimulationContext.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <SmartFleetSimulationProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </SmartFleetSimulationProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
