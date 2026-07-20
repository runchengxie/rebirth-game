import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    exclude: [
      "scripts/e2e/**",
      // uv 管理的 Python 虚拟环境里，nodejs-wheel 自带 npm 的 tap 测试文件，
      // 会被 vitest 误认为测试套件。
      ".venv/**",
      "node_modules/**",
      "dist/**",
      "dist-package/**",
      "playwright-report/**",
      "test-results/**",
    ],
  },
});
