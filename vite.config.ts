import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "tone",
              test: /node_modules[\\/]tone[\\/]/,
            },
          ],
        },
      },
    },
  },
  plugins: [react()],
});
