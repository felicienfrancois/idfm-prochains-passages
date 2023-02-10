module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-recommended",
    "plugin:@typescript-eslint/recommended",
    "@nuxtjs/eslint-config-typescript"
  ],
  parserOptions: {
    ecmaVersion: "latest",
    parser: "@typescript-eslint/parser",
    sourceType: "module",
  },
  plugins: [
    "vue",
    "@typescript-eslint"
  ],
  rules: {
    quotes: [1, "double"],
    semi: [1, "always"],
    "comma-dangle": [1, {
      arrays: "never",
      objects: "always-multiline",
      imports: "never",
      exports: "never",
      functions: "never",
    }],
    camelcase: [0, "ignore"],
    "vue/no-multiple-template-root": [0, "ignore"],
    "@typescript-eslint/no-unused-vars": [0, "ignore"],
    "no-console": [0, "ignore"],
  },
};
