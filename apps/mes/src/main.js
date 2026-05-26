import $ from "jquery";
import menuConfig from "../config/menu-config.json";
import { initMenuBar } from "./components/menuBar";
import { loadScreen } from "./components/hmiViewer";
import { initHmiCanvas } from "@viewer/components/hmiCanvas";
$(document).ready(() => {
  initHmiCanvas();
  initMenuBar(menuConfig, async (menuId) => {
    await loadScreen(menuId);
  });
  if (menuConfig.length > 0) {
    void loadScreen(menuConfig[0].id);
    $(`.menu-btn[data-menu-id="${menuConfig[0].id}"]`).addClass("active");
  }
});
