import { createSSRApp } from "vue";
import App from "./App.vue";
import "vant/lib/index.css";
import "@/static/global.scss";
export function createApp() {
  const app = createSSRApp(App);
  return {
    app,
  };
}
