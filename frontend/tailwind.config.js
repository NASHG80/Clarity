/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        warmIvory: '#F1EDE9',
        softWhite: '#F8F6F3',
        sageGreen: '#7C9278',
        deepForest: '#26382D',
        mutedSage: '#A9B8A3',
        warmBeige: '#D8C9BE',
        earthTaupe: '#A99587',
        softPeach: '#E8CFC4',
      },
    },
  },
  plugins: [],
};
