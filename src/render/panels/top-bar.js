// src/render/panels/top-bar.js
import { gameState } from '../../logic/state.js';
import { FACTION_NAMES } from '../../logic/data/constants.js';
import { saveGame } from '../../logic/save.js';

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
      ${isPlayer ? '🔔 你的行动回合' : `⏳ ${FACTION_NAMES[cf] || cf} 正在行动…`}
    </div>
    <div class="top-bar-right">
      <button class="btn-top" id="btn-save">💾 存档</button>
      <button class="btn-top" id="btn-load">📂 读档</button>
      <button class="btn-top" id="btn-exit">🚪 退出</button>
    </div>`;
  el.querySelector('#btn-save')?.addEventListener('click', () => { saveGame('manual'); alert('已保存！'); });
  el.querySelector('#btn-load')?.addEventListener('click', async () => {
    const { loadGame, listSaves } = await import('../../logic/save.js');
    const saves = await listSaves();
    if (!saves.length) { alert('没有存档'); return; }
    const slot = prompt('存档列表:\n' + saves.map(s => `${s.slot}: 第${s.meta?.turn}轮 ${s.meta?.playerFaction}`).join('\n') + '\n\n输入存档位:', 'manual');
    if (slot) {
      const r = await loadGame(slot);
      if (r.success) {
        const { showGameScreen } = await import('../screens/game-screen.js');
        showGameScreen();
      } else { alert(r.message); }
    }
  });
  el.querySelector('#btn-exit')?.addEventListener('click', async () => {
    const { showAlert } = await import('../modal.js');
    const confirmed = await showConfirm('确定退出？未保存的进度将丢失。');
    if (confirmed) {
      try { window.saveAPI?.quit(); } catch(e) {}
      window.close();
    }
  });
}
