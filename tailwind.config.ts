import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        muted: "#64748b",
        line: "#d8dee8",
        panel: "#ffffff",
        page: "#f5f7fb",
        teal: "#0f766e",
        amber: "#b45309",
        coral: "#dc5f45",
      },
      boxShadow: {
        panel: "0 1px 2px rgba(15, 23, 42, 0.06)",
      },
    },
  },
  plugins: [],
};

export default config;
