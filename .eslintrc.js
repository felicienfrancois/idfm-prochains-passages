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
    "max-len": [1, 120],
    "vue/max-len": [1, {
      code: 120,
      template: 120,
      tabWidth: 2,
      ignoreComments: true,
      ignoreTrailingComments: true,
      ignoreUrls: true,
      ignoreStrings: true,
      ignoreTemplateLiterals: true,
      ignoreRegExpLiterals: true,
      ignoreHTMLAttributeValues: true,
      ignoreHTMLTextContents: true,
    }],
    quotes: [1, "double"],
    semi: [1, "always"],
    "comma-dangle": [1, {
      arrays: "never",
      objects: "always-multiline",
      imports: "never",
      exports: "never",
      functions: "never",
    }],
    "vue/multi-word-component-names": [0, "ignore"],
    camelcase: [0, "ignore"],
    "vue/no-multiple-template-root": [0, "ignore"],
    "@typescript-eslint/no-unused-vars": [0, "ignore"],
    "no-console": [0, "ignore"],
  },
};
