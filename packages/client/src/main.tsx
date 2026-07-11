import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          className: "!bg-white dark:!bg-surface-darkAlt !text-gray-900 dark:!text-white !rounded-xl !shadow-lg",
          duration: 3500,
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
