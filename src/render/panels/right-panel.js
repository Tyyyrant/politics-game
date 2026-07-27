// src/render/panels/right-panel.js
import { gameState } from '../../logic/state.js';
import { FACTION_NAMES_CN, ACTION_NAMES_CN, SEAT_TASK_NAMES_CN } from '../../logic/data/constants.js';

export function renderRightPanel() {
  const el = document.getElementById('right-panel');
  if (!el) return;
  let h = '<div class="panel-section"><h3>📜 事件日志</h3><div class="log-stream">';
  for (const e of [...gameState.roundLog].reverse().slice(0, 15)) {
    const factionName = FACTION_NAMES_CN[e.factionId] || e.factionId;
    const actionName = ACTION_NAMES_CN[e.action] || e.action;
    const target = e.target || e.eventId || '';
    const resultText = e.result ? ` → ${e.result}` : '';
    h += `<div class="log-entry">【${factionName}】${actionName} ${target}${resultText}</div>`;
  }
  if (!gameState.roundLog.length) h += '<div class="log-empty">暂无事件，开始你的第一轮行动吧</div>';
  h += '</div></div>';

  if (gameState.currentBill) {
    const b = gameState.currentBill;
    h += `<div class="panel-section bill-status"><h3>📜 本轮法案</h3>
      <div class="bill-name">${b.name}</div><div>${b.description}</div>
      <div style="font-size:0.8em;margin-top:4px;">✅支持 ${b.votes.support.length} &nbsp; ❌反对 ${b.votes.oppose.length} &nbsp; ⏸️弃权 ${b.votes.abstain.length}</div></div>`;
  }

  el.innerHTML = h;
}
