import "zmp-ui/zaui.css";
import "./css/app.css";

import { createRoot } from "react-dom/client";
import appConfig from "../app-config.json";
import Layout from "./components/layout";

if (!window.APP_CONFIG) {
  window.APP_CONFIG = appConfig;
}

createRoot(document.getElementById("app")!).render(<Layout />);
