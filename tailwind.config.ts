import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: { colors: { ink: "#20251f", muted: "#72776f", cream: "#faf8f2", brand: "#e45d35", leaf: "#367b52" }, boxShadow: { soft: "0 16px 50px rgba(32, 37, 31, 0.08)" } } },
  plugins: []
};
export default config;