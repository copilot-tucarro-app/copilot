/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        petrol: "#0b2a4a",
        electric: "#2563eb",
        mint: "#16a34a",
        warning: "#f59e0b",
        danger: "#dc2626",
      },
      boxShadow: {
        soft: "0 18px 50px rgba(15, 23, 42, 0.12)",
        lift: "0 12px 30px rgba(37, 99, 235, 0.18)",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
