import type { Config } from "tailwindcss";

export default <Partial<Config>>{
  content: [
    "./app/components/**/*.{vue,js,ts}",
    "./app/layouts/**/*.vue",
    "./app/pages/**/*.vue",
    "./app/app.vue",
    "./components/**/*.{vue,js,ts}",
    "./layouts/**/*.vue",
    "./pages/**/*.vue",
    "./plugins/**/*.{js,ts}"
  ],
  theme: {
    extend: {
      colors: {
        accent: {
          50: "#f5f9ff",
          100: "#e6f0ff",
          500: "#2d6cdf",
          700: "#1f4ca8"
        }
      },
      boxShadow: {
        pin: "0 8px 20px rgba(0, 0, 0, 0.12)"
      }
    }
  },
  plugins: []
};
