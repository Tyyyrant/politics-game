// src/render/panels/right-panel.js
import { gameState } from '../../logic/state.js';

export function renderRightPanel() {
  const el = document.getElementById('right-panel');
  if (!el) return;
  let h = '<div class="panel-section"><h3>📜 事件日志</h3><div class="log-stream">';
  for (const e of [...gameState.roundLog].reverse().slice(0, 15)) {
    h += `<div class="log-entry">${e.factionId}: ${e.action} → ${e.target || e.eventId || ''}</div>`;
  }
  if (!gameState.roundLog.length) h += '<div class="log-empty">暂无事件</div>';
  h += '</div></div>';
  if (gameState.currentBill) {
    const b = gameState.currentBill;
    h += `<div class="panel-section bill-status"><h3>📜 本轮法案</h3>
      <div class="bill-name">${b.name}</div><div>${b.description}</div>
      <div>✅${b.votes.support.length} ❌${b.votes.oppose.length} ⏸️${b.votes.abstain.length}</div></div>`;
  }
  el.innerHTML = h;
}
