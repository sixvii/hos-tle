const tailwindOptions = process.env.NODE_ENV === "development"
  ? { optimize: { minify: false } }
  : {};

export default {
  plugins: {
    "@tailwindcss/postcss": tailwindOptions,
  },
};
