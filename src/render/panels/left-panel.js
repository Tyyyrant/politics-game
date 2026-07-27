// src/render/panels/left-panel.js
import { gameState } from '../../logic/state.js';
import { FACTION_NAMES } from '../../logic/data/constants.js';

export function renderLeftPanel() {
  const el = document.getElementById('left-panel');
  if (!el) return;
  const opponents = Object.entries(gameState.factions).filter(([id]) => id !== gameState.playerFactionId);
  const pf = gameState.factions[gameState.playerFactionId];
  let h = '<div class="panel-section"><h3>对手派系</h3>';
  for (const [fid, f] of opponents) {
    const active = fid === gameState.turnOrder[gameState.currentPlayerIndex];
    h += `<div class="opponent-row ${active ? 'active' : ''}">
      <div class="opponent-name">${FACTION_NAMES[fid]} · ${f.leaderName}</div>
      <div class="opponent-seats">🔒${f.lockedSeats}席 📊${f.influence}影响力 🔴${f.disciplineMarks}标记</div>
    </div>`;
  }
  h += '</div><div class="panel-section player-quick"><h3>我的派系</h3>';
  h += `<div>📊 影响力: ${pf.influence} | 💰 资金: ${pf.funds}</div>`;
  h += `<div>🔒 席位: ${pf.lockedSeats} | 🔴 纪委标记: ${pf.disciplineMarks}</div>`;
  const resList = Object.entries(pf.resources).filter(([,v]) => v > 0).slice(0, 6).map(([d, v]) => `${d}:${v}`).join(' ');
  h += `<div class="resource-line">${resList || '暂无资源'}</div></div>`;
  if (gameState.activeBillEffects.length) {
    h += '<div class="panel-section"><h3>生效效果</h3>';
    for (const e of gameState.activeBillEffects) h += `<div class="effect-item">· ${e.id}（${e.duration}轮）</div>`;
    h += '</div>';
  }
  el.innerHTML = h;
}
