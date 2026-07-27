// src/render/panels/left-panel.js
import { gameState } from '../../logic/state.js';
import { FACTION_NAMES, DEPT_NAMES } from '../../logic/data/constants.js';

export function renderLeftPanel() {
  const el = document.getElementById('left-panel');
  if (!el) return;
  const opponents = Object.entries(gameState.factions).filter(([id]) => id !== gameState.playerFactionId);
  const pf = gameState.factions[gameState.playerFactionId];

  let h = '';

  // === 我的派系详情 ===
  h += '<div class="panel-section player-full"><h3>👤 我的派系 — ' + pf.leaderName + '</h3>';
  h += `<div class="stat-row">📊 影响力: <b>${pf.influence}</b> &nbsp;|&nbsp; 💰 资金: <b>${pf.funds}</b></div>`;
  h += `<div class="stat-row">🔒 席位: <b>${pf.lockedSeats}/27</b> &nbsp;|&nbsp; 🔴 纪委标记: <b>${pf.disciplineMarks}</b></div>`;

  // 资源明细
  h += '<div class="resource-section"><h4>📦 资源</h4>';
  const resEntries = Object.entries(pf.resources).filter(([, v]) => v > 0);
  if (resEntries.length) {
    h += '<div class="resource-grid">';
    for (const [dept, val] of resEntries) {
      const deptName = DEPT_NAMES[dept] || dept;
      h += `<span class="resource-tag">${deptName}: <b>${val}</b></span>`;
    }
    h += '</div>';
  } else {
    h += '<div class="empty-hint">暂无资源（每轮回合开始时产出）</div>';
  }
  h += '</div>';

  // 成员列表
  h += '<div class="member-section"><h4>👥 派系成员 (' + pf.members.length + '人)</h4>';
  for (const m of pf.members) {
    const statusIcon = m.investigationStatus === 'evidence' ? '🔴' : m.investigationStatus === 'suspect' ? '🟡' : '🟢';
    const traits = m.traits.slice(0, 2).join(' · ');
    h += `<div class="member-row">
      <div class="member-name">${statusIcon} ${m.name} <span class="member-rank">${m.rank}</span></div>
      <div class="member-dept">${m.dept} · ${m.position}</div>
      <div class="member-loyalty">忠: ${m.loyalty}/9 ${traits ? '| ' + traits : ''}</div>
    </div>`;
  }
  h += '</div></div>';

  // === 对手派系 ===
  h += '<div class="panel-section"><h3>对手派系</h3>';
  for (const [fid, f] of opponents) {
    const active = fid === gameState.turnOrder[gameState.currentPlayerIndex];
    h += `<div class="opponent-row ${active ? 'active' : ''}">
      <div class="opponent-name">${FACTION_NAMES[fid]} · ${f.leaderName}</div>
      <div class="opponent-seats">🔒${f.lockedSeats}席 📊${f.influence}影 🔴${f.disciplineMarks}标</div>
    </div>`;
  }
  h += '</div>';

  // 生效效果
  if (gameState.activeBillEffects.length) {
    h += '<div class="panel-section"><h3>生效效果</h3>';
    for (const e of gameState.activeBillEffects) h += `<div class="effect-item">· ${e.id}（${e.duration}轮）</div>`;
    h += '</div>';
  }

  el.innerHTML = h;
}
