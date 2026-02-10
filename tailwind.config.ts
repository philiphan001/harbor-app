import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Harbor color palette from spec
        sand: "#F5F0E8",
        sandDark: "#E8E0D0",
        warmWhite: "#FAFAF7",
        slate: "#2C3E50",
        slateMid: "#4A6274",
        slateLight: "#7F9BAC",
        ocean: "#1B6B7D",
        oceanLight: "#E6F2F4",
        oceanMid: "#2A8FA4",
        coral: "#D4725C",
        coralLight: "#FAF0ED",
        sage: "#6B8F71",
        sageLight: "#EDF4EE",
        amber: "#C4943A",
        amberLight: "#FBF5E9",
      },
      fontFamily: {
        serif: ["var(--font-source-serif)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
