import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages usa el nombre real del repositorio como base: copilot-tucarro-app/copilot.
  base: "/copilot/",
  plugins: [react()],
});
