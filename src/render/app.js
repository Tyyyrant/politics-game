// src/render/app.js
import { gameState, createNewGame, on } from '../logic/state.js';
import { showTitleScreen } from './screens/title-screen.js';
import { showGameScreen, renderAllPanels } from './screens/game-screen.js';
import { showEndScreen } from './screens/end-screen.js';
import { renderLeftPanel } from './panels/left-panel.js';
import { renderCenterPanel } from './panels/center-panel.js';
import { renderRightPanel } from './panels/right-panel.js';
import { saveGame, loadGame } from '../logic/save.js';

// Expose for debugging
window.__gameState = () => gameState;

export function initRenderer() {
  on('turn:new-round', renderAllPanels);
  on('turn:order-determined', renderAllPanels);
  on('turn:next-player', renderAllPanels);
  on('resources:produced', renderAllPanels);
  on('seat:visited', renderAllPanels);
  on('seat:locked', renderAllPanels);
  on('seat:stolen', renderAllPanels);
  on('seat:expired', renderAllPanels);
  on('bill:drawn', renderAllPanels);
  on('bill:voted', renderAllPanels);
  on('bill:resolved', renderAllPanels);
  on('event:drawn', renderAllPanels);
  on('event:resolved', renderAllPanels);
  on('investigation:result', renderAllPanels);
  on('skill:*', renderAllPanels);
  on('loyalty:changed', renderAllPanels);
  on('victory:win', (d) => showEndScreen(true, d));
  on('victory:lose', (d) => showEndScreen(false, d));
  on('victory:early-defeat', (d) => showEndScreen(false, d));
  showTitleScreen();
}

initRenderer();
