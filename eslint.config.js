const browserGlobals = {
  document: "readonly",
  fetch: "readonly",
  window: "readonly"
};

const nodeGlobals = {
  __dirname: "readonly",
  console: "readonly",
  module: "readonly",
  process: "readonly",
  require: "readonly"
};

module.exports = [
  {
    ignores: ["src/node_modules/**"]
  },
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: nodeGlobals
    },
    rules: {
      eqeqeq: "error",
      "no-undef": "error",
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }]
    }
  },
  {
    files: ["src/public/**/*.js"],
    languageOptions: {
      globals: browserGlobals,
      sourceType: "script"
    }
  }
];
