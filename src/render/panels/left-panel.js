// src/render/panels/left-panel.js
import { gameState } from '../../logic/state.js';
import { FACTION_NAMES, DEPT_NAMES, SEAT_TASK_NAMES_CN } from '../../logic/data/constants.js';
import { getBillEffectDescriptions } from '../../logic/bills.js';

export function renderLeftPanel() {
  const el = document.getElementById('left-panel');
  if (!el) return;
  const opponents = Object.entries(gameState.factions).filter(([id]) => id !== gameState.playerFactionId);
  const pf = gameState.factions[gameState.playerFactionId];

  let h = '';

  // === 我的派系详情 ===
  h += '<div class="panel-section player-full"><h3>👤 我的派系 — ' + pf.leaderName + '</h3>';
  h += `<div class="stat-row">📊 影响力: <b>${pf.influence}</b> &nbsp;|&nbsp; 💰 资金: <b>${pf.funds}</b></div>`;
  const visitsLeft = 2 - (pf.visitsThisTurn || 0);
  h += `<div class="stat-row">🔒 席位: <b>${pf.lockedSeats}/27</b> &nbsp;|&nbsp; 🔴 纪委标记: <b>${pf.disciplineMarks}</b></div>`;
  h += `<div class="stat-row">👁️ 剩余拜访: <b>${visitsLeft}/2</b> &nbsp;|&nbsp; 👥 攻略中: <b>${pf.activeSeatTasks.length || gameState.npcSeats.filter(s => s.visitorId === gameState.playerFactionId).length}</b></div>`;

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

  // 生效法案效果（紧挨资源，显眼位置）
  const effectsDesc = getBillEffectDescriptions();
  if (effectsDesc.length) {
    h += '<div class="panel-section bill-effects-box">';
    for (const d of effectsDesc) {
      const isPassed = d.includes('（通过）');
      h += `<div class="effect-item">${isPassed ? '✅ 已通过' : '❌ 未通过'} ${d}</div>`;
    }
    h += '</div>';
  }

  // 正在攻略的席位
  const mySeats = gameState.npcSeats.filter(s => s.visitorId === gameState.playerFactionId && !s.lockedById);
  if (mySeats.length) {
    h += '<div class="active-seats-section"><h4>🎯 正在攻略的席位</h4>';
    for (const s of mySeats) {
      const taskName = SEAT_TASK_NAMES_CN[s.task.type] || s.task.type;
      const deptName = DEPT_NAMES[s.task.resourceType] || s.task.resourceType;
      const canComplete = s.visitedOnTurn !== gameState.turn;
      const statusText = canComplete ? '✅可完成' : '⏳下轮可完成';
      h += `<div class="active-seat-row">
        <div class="active-seat-name">${s.name} · ${taskName}</div>
        <div class="active-seat-cost">💰 ${s.task.cost} ${deptName} &nbsp;|&nbsp; ⏰ 剩余 ${s.roundsRemaining} 轮 &nbsp;|&nbsp; ${statusText}</div>
      </div>`;
    }
    h += '</div>';
  }

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

  el.innerHTML = h;
}
