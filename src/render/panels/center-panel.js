// src/render/panels/center-panel.js
import { gameState } from '../../logic/state.js';
import { executeAction } from '../../logic/actions.js';
import { executeSkill } from '../../logic/skills.js';
import { nextPlayer } from '../../logic/turn.js';
import { ACTION_TYPES } from '../../logic/data/constants.js';
import { renderAllPanels } from '../screens/game-screen.js';

export function renderCenterPanel() {
  const el = document.getElementById('center-panel');
  if (!el) return;
  const cf = gameState.turnOrder[gameState.currentPlayerIndex];
  const isPlayer = cf === gameState.playerFactionId;
  let h = '<div class="center-content">';
  if (gameState.currentEvent) {
    const ev = gameState.currentEvent;
    h += `<div class="event-card"><div class="event-card-header">📋 ${ev.name}</div><div class="event-card-body">${ev.description}</div></div>`;
  }
  if (isPlayer) {
    h += '<div class="action-panel"><h3>选择行动</h3><div class="action-grid">';
    h += btn('拜访人大席位', 'visitSeat');
    h += btn('完成席位任务', 'completeTask');
    h += btn('打探对手席位', 'scoutSeat');
    h += btn('抢夺对手席位', 'stealSeat');
    h += btn('查处对手干部', 'investigate');
    h += btn('公安审讯', 'interrogate');
    h += btn('突击检查', 'raid');
    h += btn('正面宣传', 'positivePropaganda');
    h += btn('负面曝光', 'negativePropaganda');
    h += btn('项目招标', 'projectBid');
    h += btn('五年计划', 'fiveYearPlan');
    h += btn('资金变现', 'sasacCash');
    h += btn('干部任用', 'appoint');
    h += btn('提升忠诚度', 'boostLoyalty');
    h += btn('商人上门', 'merchant');
    h += btn('结束回合', 'endTurn');
    h += '</div></div>';
  } else {
    h += `<div class="ai-display">⏳ AI ${cf} 正在决策...</div>`;
  }
  h += '</div>';
  el.innerHTML = h;
  if (isPlayer) bindButtons(el, cf);
}

function btn(label, action) { return `<button class="action-btn" data-action="${action}">${label}</button>`; }

function bindButtons(el, factionId) {
  el.querySelectorAll('.action-btn').forEach(b => {
    b.addEventListener('click', async () => {
      const action = b.dataset.action;
      if (action === 'endTurn') {
        executeAction(factionId, ACTION_TYPES.END_TURN);
        if (!nextPlayer()) { /* 所有玩家结束，进入法案阶段 */ }
        renderAllPanels();
      } else if (action === 'visitSeat') {
        const seatId = prompt('输入席位ID (seat_01 ~ seat_27):');
        if (seatId) { executeAction(factionId, ACTION_TYPES.VISIT_SEAT, { seatId }); renderAllPanels(); }
      } else if (action === 'completeTask') {
        const seatId = prompt('输入要完成的席位ID:');
        if (seatId) { executeAction(factionId, ACTION_TYPES.COMPLETE_TASK, { seatId }); renderAllPanels(); }
      } else if (action === 'investigate') {
        const target = prompt('目标派系ID (propaganda/discipline/organization/publicSecurity):');
        const mid = prompt('目标成员ID:');
        if (target && mid) { executeAction(factionId, ACTION_TYPES.INVESTIGATE, { targetFactionId: target, memberId: mid }); renderAllPanels(); }
      }
      // 其他按钮类似处理
    });
  });
}
