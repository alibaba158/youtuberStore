import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { getStoredTheme, applyTheme } from "./lib/themes";
import "./index.css";

// Initialize theme on app start
const storedTheme = getStoredTheme();
applyTheme(storedTheme);

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

createRoot(document.getElementById("root")!).render(
  <ConvexAuthProvider client={convex}>
    <App />
  </ConvexAuthProvider>
);
