/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F4ECD8",
        panel: "#FBF6EA",
        ink: "#221B14",
        muted: "#7A6F5C",
      },
    },
  },
  plugins: [],
};
