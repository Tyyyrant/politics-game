// src/render/screens/game-screen.js
import { gameState } from '../../logic/state.js';
import { startNewRound, determineTurnOrder } from '../../logic/turn.js';
import { renderTopBar } from '../panels/top-bar.js';
import { renderLeftPanel } from '../panels/left-panel.js';
import { renderCenterPanel } from '../panels/center-panel.js';
import { renderRightPanel } from '../panels/right-panel.js';

export function showGameScreen() {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div id="top-bar"></div>
    <div class="game-main">
      <div id="left-panel" class="panel-left"></div>
      <div id="center-panel" class="panel-center"></div>
      <div id="right-panel" class="panel-right"></div>
    </div>`;
  startNewRound();
  determineTurnOrder();
  setTimeout(() => renderAllPanels(), 50);
}

export function renderAllPanels() {
  if (!gameState || gameState.phase === 'gameOver') return;
  try {
    renderTopBar();
    renderLeftPanel();
    renderCenterPanel();
    renderRightPanel();
  } catch (e) { console.error('render error:', e); }
}
