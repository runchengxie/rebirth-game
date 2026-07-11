import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist", "dist-package", "node_modules", ".venv", "*.tsbuildinfo", "data/game-data.js"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        AudioContext: "readonly",
        ResizeObserver: "readonly",
        document: "readonly",
        localStorage: "readonly",
        performance: "readonly",
        setTimeout: "readonly",
        window: "readonly",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      // 复杂度看门狗：长函数拆不动时先报警，倒逼 content.ts / engine.ts 拆分。
      complexity: ["warn", { max: 15 }],
      // strict 里 no-explicit-any 默认 error。本项目历史用了若干 any（多来自 JSON
      // 反序列化与第三方库边界），先降为 warn 逐步清，避免一次性大改阻断 check。
      "@typescript-eslint/no-explicit-any": "warn",
      // strict 默认把 non-null 断言当 error。本项目（尤其测试）多处用 `x!.y`
      // 表达「已前置守卫」的语义，强行全改风险高、收益低，降为 warn 作信号。
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },
  {
    files: ["scripts/**/*.js"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        console: "readonly",
        process: "readonly",
        require: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
