import { defineConfig } from "vite";
import path from "path";
var stdin_default = defineConfig({
  resolve: {
    alias: {
      "@wzhmi/core": path.resolve(__dirname, "../../packages/core/src/index.js"),
      "@wzhmi/widgets": path.resolve(__dirname, "../../packages/widgets/src/index.js"),
      "@viewer": path.resolve(__dirname, "../viewer/src")
    }
  }
});
export {
  stdin_default as default
};
