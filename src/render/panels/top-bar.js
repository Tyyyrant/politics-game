// src/render/panels/top-bar.js
import { gameState } from '../../logic/state.js';
import { FACTION_NAMES, ACTION_TYPES } from '../../logic/data/constants.js';
import { saveGame } from '../../logic/save.js';
import { showAlert, showConfirm, showPrompt, showSelect } from '../modal.js';

export function renderTopBar() {
  const el = document.getElementById('top-bar');
  if (!el) return;
  const cf = gameState.turnOrder[gameState.currentPlayerIndex];
  const isPlayer = cf === gameState.playerFactionId;
  const labels = { dice: '顺位判定', action: '行动阶段', bill: '法案投票', cleanup: '结算', gameOver: '游戏结束' };
  el.innerHTML = `
    <div class="top-bar-left">
      <span class="round-indicator">第 ${gameState.turn} 轮</span>
      <span class="phase-indicator">${labels[gameState.phase] || ''}</span>
    </div>
    <div class="top-bar-center ${isPlayer ? 'player-turn' : 'ai-turn'}">
      ${gameState.phase === 'bill' ? '📜 法案投票中' : (isPlayer ? '🔔 你的行动回合' : `⏳ ${FACTION_NAMES[cf] || cf} 正在行动…`)}
      ${isPlayer && gameState.phase === 'action' ? '<button class="btn-end-turn-bar" id="btn-end-turn-bar">✅ 完成行动</button>' : ''}
    </div>
    <div class="top-bar-right">
      <button class="btn-top" id="btn-save">💾 存档</button>
      <button class="btn-top" id="btn-load">📂 读档</button>
      <button class="btn-top" id="btn-exit">🚪 退出</button>
    </div>`;

  el.querySelector('#btn-save')?.addEventListener('click', async () => {
    saveGame('manual');
    await showAlert('已保存！');
  });

  el.querySelector('#btn-load')?.addEventListener('click', async () => {
    const { loadGame, listSaves } = await import('../../logic/save.js');
    const saves = await listSaves();
    if (!saves.length) { await showAlert('没有存档'); return; }
    const slot = await showPrompt('输入存档位名称\n可用: ' + saves.map(s => s.slot).join(', '));
    if (slot) {
      const r = await loadGame(slot);
      if (r.success) {
        const { showGameScreen } = await import('../screens/game-screen.js');
        showGameScreen();
      } else { await showAlert(r.message); }
    }
  });

  el.querySelector('#btn-end-turn-bar')?.addEventListener('click', async () => {
    const { executeAction } = await import('../../logic/actions.js');
    const { advanceAfterPlayer } = await import('../panels/center-panel.js');
    executeAction(gameState.playerFactionId, ACTION_TYPES.END_TURN);
    advanceAfterPlayer();
  });

  el.querySelector('#btn-exit')?.addEventListener('click', async () => {
    const ok = await showConfirm('确定退出游戏？\n未保存的进度将丢失。');
    if (ok) {
      // Direct window close — Electron will handle it
      try { window.close(); } catch(e) {}
      // Backup: try IPC
      try { if (window.saveAPI) window.saveAPI.quit(); } catch(e) {}
    }
  });
}
