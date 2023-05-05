import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import Components from "unplugin-vue-components/vite";
import { VantResolver } from "unplugin-vue-components/resolvers";
const path = require("path");
export default defineConfig({
  plugins: [
    uni(),
    Components({
      resolvers: [VantResolver()],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  // 生产环境移除 console
  esbuild: {
    pure: ["console.log"],
    drop: ["debugger"],
  },
});
