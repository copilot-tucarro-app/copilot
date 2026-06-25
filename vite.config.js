import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages publica en la raiz del dominio personalizado copilot360.co.
  base: "/",
  plugins: [react()],
});
