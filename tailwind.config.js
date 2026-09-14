/** @type {import('tailwindcss').Config} */
export default {
  // Tailwind v3 pinned deliberately (see docs/ADR-001-tailwind-v3.md) —
  // v4 changes the meaning of `rounded-sm`/`shadow-sm` and bare `border`
  // colors, which the ported print templates rely on.
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1F2A30",
        paper: "#DED7C0",
        rule: "#C9C2A8",
        muted: "#5C6A5E",
        rust: "#B5502F",
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
        headline: ["Space Grotesk", "IBM Plex Sans", "sans-serif"],
        sans: ["IBM Plex Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};
