// MES 앱 진입점 — 메뉴바 초기화 및 HMI 캔버스 부트스트랩
import $ from 'jquery';
import menuConfig from '../config/menu-config.json';
import { initMenuBar } from './components/menuBar';
import { loadScreen } from './components/hmiViewer';
import { initHmiCanvas } from '@viewer/components/hmiCanvas';

$(document).ready(() => {
  initHmiCanvas();

  initMenuBar(menuConfig, async (menuId) => {
    await loadScreen(menuId);
  });

  // 첫 번째 화면 자동 로드
  if (menuConfig.length > 0) {
    void loadScreen(menuConfig[0].id);
    // 첫 메뉴 버튼 활성화
    $(`.menu-btn[data-menu-id="${menuConfig[0].id}"]`).addClass('active');
  }
});
