import { defineConfig } from "vite";
import path from "path";
var stdin_default = defineConfig({
  resolve: {
    extensions: [".ts", ".tsx", ".mts", ".mjs", ".js", ".jsx", ".json"],
    alias: {
      "@wzhmi/core": path.resolve(__dirname, "../../packages/core/src/index.js"),
      "@wzhmi/widgets": path.resolve(__dirname, "../../packages/widgets/src/index.js")
    }
  }
});
export {
  stdin_default as default
};
