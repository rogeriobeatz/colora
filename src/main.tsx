import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

console.log("[Colora] Iniciando aplicação...");

// Global error handler para debug
window.onerror = function(message, source, lineno, colno, error) {
  console.error("[Colora Error]", { message, source, lineno, colno, error });
  return false;
};

const rootElement = document.getElementById("root");

if (!rootElement) {
  console.error("[Colora] Elemento #root não encontrado!");
} else {
  try {
    createRoot(rootElement).render(<App />);
    console.log("[Colora] React montado com sucesso.");
  } catch (err) {
    console.error("[Colora] Falha fatal na montagem do React:", err);
  }
}
