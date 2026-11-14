module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12201B",
        brand: { DEFAULT: "#0E5A43", dark: "#093D2D", light: "#E3F1EB" },
        gold: { DEFAULT: "#E0A526", light: "#FBF0D3" },
      },
      fontFamily: { sans: ["var(--font-bn)", "system-ui", "sans-serif"] },
    },
  },
  plugins: [],
};
