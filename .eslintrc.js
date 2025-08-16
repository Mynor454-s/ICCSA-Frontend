// .eslintrc.js
export default {
  parser: "@typescript-eslint/parser",
  plugins: ["react", "react-hooks", "@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  settings: {
    react: {
      version: "detect", // Detecta versión automáticamente
    },
  },
  rules: {
    "@typescript-eslint/consistent-type-imports": "warn", // Recomendado con TypeScript moderno
    "react/react-in-jsx-scope": "off", // No es necesario con Vite
  },
};
