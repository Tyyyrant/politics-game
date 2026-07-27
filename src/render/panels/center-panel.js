// src/render/panels/center-panel.js
import { gameState } from '../../logic/state.js';
import { executeAction } from '../../logic/actions.js';
import { executeSkill } from '../../logic/skills.js';
import { nextPlayer, isCurrentPlayerAI } from '../../logic/turn.js';
import { produceResources } from '../../logic/resources.js';
import { decideAIActions } from '../../logic/ai/decider.js';
import { ACTION_TYPES } from '../../logic/data/constants.js';
import { renderAllPanels } from '../screens/game-screen.js';

export function renderCenterPanel() {
  const el = document.getElementById('center-panel');
  if (!el) return;
  const cf = gameState.turnOrder[gameState.currentPlayerIndex];
  const isPlayer = cf === gameState.playerFactionId;
  let h = '<div class="center-content">';

  // Show current event if any
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
    h += '<button class="action-btn end-turn-btn" data-action="endTurn">✅ 结束回合</button>';
    h += '</div></div>';
  } else {
    h += `<div class="ai-display">⏳ 正在等待其他派系行动...</div>`;
  }
  h += '</div>';
  el.innerHTML = h;

  if (isPlayer) {
    bindButtons(el, cf);
  } else {
    // Auto-execute AI turn after a short delay
    setTimeout(() => executeAITurn(cf), 500);
  }
}

function btn(label, action) {
  return `<button class="action-btn" data-action="${action}">${label}</button>`;
}

function bindButtons(el, factionId) {
  el.querySelectorAll('.action-btn').forEach(b => {
    b.addEventListener('click', () => {
      const action = b.dataset.action;
      if (action === 'endTurn') {
        executeAction(factionId, ACTION_TYPES.END_TURN);
        advanceAfterPlayer();
      } else {
        handlePlayerAction(factionId, action);
      }
    });
  });
}

function handlePlayerAction(factionId, action) {
  let result;
  switch (action) {
    case 'visitSeat': {
      const seatId = prompt('输入席位ID (seat_01 ~ seat_27):');
      if (seatId) { result = executeAction(factionId, ACTION_TYPES.VISIT_SEAT, { seatId }); alert(result.message); }
      break;
    }
    case 'completeTask': {
      const seatId = prompt('输入要完成的席位ID:');
      if (seatId) { result = executeAction(factionId, ACTION_TYPES.COMPLETE_TASK, { seatId }); alert(result.message); }
      break;
    }
    case 'scoutSeat': {
      const seatId = prompt('输入要打探的席位ID:');
      if (seatId) { result = executeAction(factionId, ACTION_TYPES.SCOUT_SEAT, { seatId }); alert(result.message + (result.data ? JSON.stringify(result.data) : '')); }
      break;
    }
    case 'stealSeat': {
      const seatId = prompt('输入要抢夺的席位ID:');
      if (seatId) { result = executeAction(factionId, ACTION_TYPES.STEAL_SEAT, { seatId }); alert(result.message); }
      break;
    }
    case 'investigate': {
      const target = prompt('目标派系ID (discipline/organization/publicSecurity/npcCongress/npcCppcc):');
      const mid = prompt('目标成员ID:');
      if (target && mid) { result = executeAction(factionId, ACTION_TYPES.INVESTIGATE, { targetFactionId: target, memberId: mid }); alert(result.message); }
      break;
    }
    case 'interrogate':
      result = executeSkill(factionId, 'interrogate', { targetFactionId: prompt('目标派系ID:') || '' });
      if (result) alert(result.message);
      break;
    case 'raid':
      result = executeSkill(factionId, 'raid', { targetFactionId: prompt('目标派系ID:') || '' });
      if (result) alert(result.message);
      break;
    case 'positivePropaganda':
      result = executeSkill(factionId, 'positivePropaganda', { taskType: prompt('任务类型:') || '' });
      if (result) alert(result.message);
      break;
    case 'negativePropaganda':
      result = executeSkill(factionId, 'negativePropaganda', { targetFactionId: prompt('目标派系ID:') || '' });
      if (result) alert(result.message);
      break;
    case 'projectBid':
      result = executeSkill(factionId, 'projectBid', {});
      if (result) alert(result.message);
      break;
    case 'fiveYearPlan':
      result = executeSkill(factionId, 'fiveYearPlan', {});
      if (result) alert(result.message);
      break;
    case 'sasacCash':
      result = executeSkill(factionId, 'sasacCash', {});
      if (result) alert(result.message);
      break;
    case 'appoint': {
      const dept = prompt('部门ID (如 organization/publicSecurity):');
      const rank = prompt('职级 (副处/正处/副厅):');
      if (dept && rank) {
        import('../../logic/loyalty.js').then(m => { result = m.appointOfficial(factionId, dept, rank); alert(result.message); renderAllPanels(); });
      }
      break;
    }
    case 'boostLoyalty': {
      const mid = prompt('成员ID:');
      if (mid) {
        import('../../logic/loyalty.js').then(m => { result = m.boostLoyalty(factionId, mid, 'influence'); alert(result.message); renderAllPanels(); });
      }
      break;
    }
    case 'merchant': {
      import('../../logic/bribery.js').then(m => { result = m.triggerMerchant(factionId); alert(result.message); renderAllPanels(); });
      break;
    }
  }
  renderAllPanels();
}

function advanceAfterPlayer() {
  if (nextPlayer()) {
    // More players — check if next is AI
    if (isCurrentPlayerAI()) {
      const cf = gameState.turnOrder[gameState.currentPlayerIndex];
      setTimeout(() => executeAITurn(cf), 300);
    }
    renderAllPanels();
  } else {
    // All done — go to bill phase
    renderAllPanels();
  }
}

async function executeAITurn(factionId) {
  // 1. Draw and resolve event
  const eventModule = await import('../../logic/events.js');
  const event = eventModule.drawEvent(factionId);
  eventModule.resolveEvent(factionId);

  // 2. Produce resources
  const resModule = await import('../../logic/resources.js');
  resModule.produceResources(factionId);
  if (gameState.turn % 2 === 0) {
    // Party school bonus: 2 random resources
    const depts = Object.keys(gameState.factions[factionId].resources);
    if (depts.length) {
      const d1 = depts[Math.floor(Math.random() * depts.length)];
      const d2 = depts[Math.floor(Math.random() * depts.length)];
      gameState.factions[factionId].resources[d1] = (gameState.factions[factionId].resources[d1] || 0) + 1;
      gameState.factions[factionId].resources[d2] = (gameState.factions[factionId].resources[d2] || 0) + 1;
    }
  }

  // 3. AI decision and execution
  const decisions = decideAIActions(factionId);
  for (const d of decisions) {
    if (d.type === 'interrogate' || d.type === 'raid' || d.type === 'projectBid' || d.type === 'fiveYearPlan' || d.type === 'sasacCash' || d.type === 'positivePropaganda' || d.type === 'negativePropaganda' || d.type === 'projectVeto' || d.type === 'rerollDice') {
      executeSkill(factionId, d.type, d.params);
    } else if (d.type === 'bribery') {
      const bModule = await import('../../logic/bribery.js');
      bModule.triggerMerchant(factionId);
    } else {
      executeAction(factionId, d.type, d.params);
    }
  }

  // 4. Advance
  if (nextPlayer()) {
    if (isCurrentPlayerAI()) {
      const nextFid = gameState.turnOrder[gameState.currentPlayerIndex];
      setTimeout(() => executeAITurn(nextFid), 300);
    }
  }
  renderAllPanels();
}
