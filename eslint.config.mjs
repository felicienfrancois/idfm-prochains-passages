import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt({
  rules: {
    "max-len": [1, 300],
    "vue/max-len": [1, {
      code: 150,
      template: 150,
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
    "@typescript-eslint/no-explicit-any": 0,
    "@typescript-eslint/no-unsafe-function-type": 0,
    "no-console": [0, "ignore"],
  },
});
