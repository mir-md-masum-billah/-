module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0E1B17",
        night: "#04261E",
        pearl: "#F4F6F3",
        brand: { DEFAULT: "#0A4435", dark: "#052B21", light: "#E6EFEA", soft: "#CFE0D8" },
        gold: { DEFAULT: "#C49B3F", deep: "#9A7623", soft: "#E8D08A", light: "#F6EDD3" },
        // পুরনো পেজগুলোর slate/red/amber ক্লাস নতুন রঙে বদলে যাবে — কোনো পেজ আলাদা করে বদলাতে হবে না
        slate: { 50: "#F6F8F6", 100: "#EDF1EE", 200: "#DCE3DE", 300: "#C3CDC7", 400: "#97A59D", 500: "#64746B", 600: "#4D5C54", 700: "#3A4640", 800: "#2A3530", 900: "#1A231F" },
        red: { 50: "#FBEFF0", 100: "#F6DADD", 200: "#EDB8BE", 300: "#DF8993", 400: "#C95B69", 500: "#B53D4D", 600: "#A82A3B", 700: "#8C1F30", 800: "#701827", 900: "#561320" },
        amber: { 50: "#FBF5E4", 100: "#F6EBC9", 200: "#EDDA9F", 300: "#E0C26F", 400: "#CFA84A", 500: "#B88E33", 600: "#9A7623", 700: "#7F6019", 800: "#664B14", 900: "#523C10" },
      },
      fontFamily: {
        sans: ["var(--font-bn)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-bn)", "serif"],
      },
      boxShadow: {
        lux: "0 1px 0 rgba(5,43,33,.04), 0 18px 40px -22px rgba(5,43,33,.28)",
        gilt: "0 0 0 1px rgba(196,155,63,.35), 0 24px 48px -24px rgba(5,43,33,.45)",
      },
    },
  },
  plugins: [],
};
