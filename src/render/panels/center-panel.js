// src/render/panels/center-panel.js
import { gameState } from '../../logic/state.js';
import { executeAction } from '../../logic/actions.js';
import { executeSkill } from '../../logic/skills.js';
import { nextPlayer, isCurrentPlayerAI } from '../../logic/turn.js';
import { produceResources } from '../../logic/resources.js';
import { decideAIActions } from '../../logic/ai/decider.js';
import { ACTION_TYPES } from '../../logic/data/constants.js';
import { renderAllPanels } from '../screens/game-screen.js';

let _billResolved = false;

export function renderCenterPanel() {
  const el = document.getElementById('center-panel');
  if (!el) return;

  // === Bill phase ===
  if (gameState.phase === 'bill') {
    renderBillPhase(el);
    return;
  }

  // === Cleanup phase ===
  if (gameState.phase === 'cleanup') return;

  // === Action phase ===
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
    h += '<button class="action-btn end-turn-btn" data-action="endTurn">✅ 结束回合</button>';
    h += '</div></div>';
  } else {
    h += `<div class="ai-display">⏳ 等待其他派系行动完成...</div>`;
  }
  h += '</div>';
  el.innerHTML = h;

  if (isPlayer) {
    bindButtons(el, cf);
  } else if (gameState.phase === 'action') {
    setTimeout(() => executeAITurn(cf), 400);
  }
}

// === BILL PHASE ===
function renderBillPhase(el) {
  // Ensure bill is drawn
  if (!gameState.currentBill) {
    import('../../logic/bills.js').then(m => m.drawBill()).then(() => renderBillPhase(el));
    return;
  }
  const bill = gameState.currentBill;
  const isPlayer = gameState.playerFactionId;

  let h = '<div class="center-content"><div class="bill-phase">';
  h += `<div class="event-card"><div class="event-card-header">📜 法案投票</div>`;
  h += `<div class="event-card-body"><b>${bill.name}</b><br>${bill.description || ''}</div></div>`;
  h += '<div class="bill-vote-section"><h4>选择你的立场</h4>';
  h += '<div class="action-grid">';
  h += '<button class="action-btn support-btn" id="bill-support">✅ 支持</button>';
  h += '<button class="action-btn oppose-btn" id="bill-oppose">❌ 反对</button>';
  h += '<button class="action-btn abstain-btn" id="bill-abstain">⏸️ 弃权</button>';
  h += '</div></div>';

  // Show current votes
  h += '<div class="bill-vote-status">';
  h += `✅支持: ${bill.votes.support.length}派系 &nbsp; ❌反对: ${bill.votes.oppose.length}派系 &nbsp; ⏸️弃权: ${bill.votes.abstain.length}派系`;
  h += '</div></div></div>';

  el.innerHTML = h;

  // Auto-vote for AI factions
  setTimeout(async () => {
    const billsMod = await import('../../logic/bills.js');
    for (const fid of gameState.turnOrder) {
      if (fid === gameState.playerFactionId) continue;
      if ([...bill.votes.support, ...bill.votes.oppose, ...bill.votes.abstain].some(v => v.factionId === fid)) continue;
      const stances = ['support', 'oppose', 'abstain'];
      billsMod.castVote(fid, stances[Math.floor(Math.random() * stances.length)]);
    }
    renderAllPanels();

    // Resolve bill after AI votes
    setTimeout(() => {
      const result = billsMod.resolveBill();
      renderAllPanels();
      // Go to cleanup then next round
      setTimeout(() => {
        import('../../logic/turn.js').then(t => {
          t.enterCleanup();
          t.startNewRound();
          t.determineTurnOrder();
          renderAllPanels();
          // If first player is AI, auto-execute
          if (t.isCurrentPlayerAI()) {
            const nf = gameState.turnOrder[gameState.currentPlayerIndex];
            setTimeout(() => executeAITurn(nf), 400);
          }
        });
      }, 800);
    }, 500);
  }, 300);

  // Player vote buttons
  el.querySelector('#bill-support')?.addEventListener('click', async () => {
    (await import('../../logic/bills.js')).castVote(gameState.playerFactionId, 'support');
    el.querySelector('#bill-support').disabled = true;
    el.querySelector('#bill-oppose').disabled = true;
    el.querySelector('#bill-abstain').disabled = true;
    renderAllPanels();
  });
  el.querySelector('#bill-oppose')?.addEventListener('click', async () => {
    (await import('../../logic/bills.js')).castVote(gameState.playerFactionId, 'oppose');
    el.querySelector('#bill-support').disabled = true;
    el.querySelector('#bill-oppose').disabled = true;
    el.querySelector('#bill-abstain').disabled = true;
    renderAllPanels();
  });
  el.querySelector('#bill-abstain')?.addEventListener('click', async () => {
    (await import('../../logic/bills.js')).castVote(gameState.playerFactionId, 'abstain');
    el.querySelector('#bill-support').disabled = true;
    el.querySelector('#bill-oppose').disabled = true;
    el.querySelector('#bill-abstain').disabled = true;
    renderAllPanels();
  });
}

// === PLAYER ACTIONS ===
function btn(label, action) { return `<button class="action-btn" data-action="${action}">${label}</button>`; }

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
  let msg = '';
  try {
    switch (action) {
      case 'visitSeat': {
        const sid = prompt('席位ID (seat_01~seat_27):');
        if (sid) msg = executeAction(factionId, ACTION_TYPES.VISIT_SEAT, { seatId: sid }).message;
        break;
      }
      case 'completeTask': {
        const sid = prompt('席位ID:');
        if (sid) msg = executeAction(factionId, ACTION_TYPES.COMPLETE_TASK, { seatId: sid }).message;
        break;
      }
      case 'scoutSeat': {
        const sid = prompt('席位ID:');
        if (sid) {
          const r = executeAction(factionId, ACTION_TYPES.SCOUT_SEAT, { seatId: sid });
          msg = r.message + (r.data ? '\n任务: ' + r.data.task.type + ' 费用: ' + r.data.task.cost : '');
        }
        break;
      }
      case 'stealSeat': {
        const sid = prompt('席位ID:');
        if (sid) msg = executeAction(factionId, ACTION_TYPES.STEAL_SEAT, { seatId: sid }).message;
        break;
      }
      case 'investigate': {
        const target = prompt('目标派系 (discipline/organization/publicSecurity):');
        if (!target) break;
        const faction = gameState.factions[target];
        if (!faction) { msg = '派系不存在'; break; }
        const list = faction.members.filter(m => !m.isUnderInvestigation).map(m => `${m.id}: ${m.name}(${m.rank})`).join('\n');
        const mid = prompt('选择目标:\n' + list);
        if (mid) msg = executeAction(factionId, ACTION_TYPES.INVESTIGATE, { targetFactionId: target, memberId: mid }).message;
        break;
      }
      case 'interrogate': {
        const target = prompt('审讯目标派系 (discipline/organization/publicSecurity):');
        if (target) msg = executeSkill(factionId, 'interrogate', { targetFactionId: target }).message;
        break;
      }
      case 'raid': {
        const target = prompt('突击检查目标派系:');
        if (target) msg = executeSkill(factionId, 'raid', { targetFactionId: target }).message;
        break;
      }
      case 'positivePropaganda': {
        const taskType = prompt('指定任务类型 (arrangeSchool/arrangeJob/bailFriend/businessProject/buildConnections):');
        if (taskType) msg = executeSkill(factionId, 'positivePropaganda', { taskType }).message;
        break;
      }
      case 'negativePropaganda': {
        const target = prompt('负面曝光目标派系:');
        if (target) msg = executeSkill(factionId, 'negativePropaganda', { targetFactionId: target }).message;
        break;
      }
      case 'projectBid':
        msg = executeSkill(factionId, 'projectBid', {}).message;
        break;
      case 'fiveYearPlan':
        msg = executeSkill(factionId, 'fiveYearPlan', {}).message;
        break;
      case 'sasacCash':
        msg = executeSkill(factionId, 'sasacCash', {}).message;
        break;
      case 'appoint': {
        const dept = prompt('部门 (如 organization/publicSecurity/govOffice):');
        const rank = prompt('职级 (副处/正处/副厅):');
        if (dept && rank) {
          import('../../logic/loyalty.js').then(m => {
            alert(m.appointOfficial(factionId, dept, rank).message);
          });
        }
        break;
      }
      case 'boostLoyalty': {
        const faction = gameState.factions[factionId];
        const list = faction.members.map(m => `${m.id}: ${m.name} 忠${m.loyalty}`).join('\n');
        const mid = prompt('选择成员:\n' + list);
        if (mid) {
          import('../../logic/loyalty.js').then(m => {
            alert(m.boostLoyalty(factionId, mid, 'influence').message);
          });
        }
        break;
      }
      case 'merchant': {
        import('../../logic/bribery.js').then(m => {
          alert(m.triggerMerchant(factionId).message);
        });
        break;
      }
    }
  } catch (e) {
    msg = '错误: ' + e.message;
  }
  if (msg) alert(msg);
  renderAllPanels();
}

function advanceAfterPlayer() {
  if (nextPlayer()) {
    if (isCurrentPlayerAI()) {
      const cf = gameState.turnOrder[gameState.currentPlayerIndex];
      setTimeout(() => executeAITurn(cf), 300);
    }
    renderAllPanels();
  } else {
    // All actions done → start bill phase
    gameState.phase = 'bill';
    gameState.currentBill = null;
    renderAllPanels();
  }
}

// === AI TURN ===
async function executeAITurn(factionId) {
  try {
    // Draw event
    const evMod = await import('../../logic/events.js');
    evMod.drawEvent(factionId);
    evMod.resolveEvent(factionId);

    // Produce resources
    produceResources(factionId);
    if (gameState.turn % 2 === 0) {
      const depts = Object.keys(gameState.factions[factionId].resources);
      if (depts.length) {
        const d1 = depts[Math.floor(Math.random() * depts.length)];
        const d2 = depts[Math.floor(Math.random() * depts.length)];
        gameState.factions[factionId].resources[d1] = (gameState.factions[factionId].resources[d1] || 0) + 1;
        gameState.factions[factionId].resources[d2] = (gameState.factions[factionId].resources[d2] || 0) + 1;
      }
    }

    // Decide and execute actions
    const decisions = decideAIActions(factionId);
    for (const d of decisions) {
      try {
        if (['interrogate', 'raid', 'projectBid', 'fiveYearPlan', 'sasacCash', 'positivePropaganda', 'negativePropaganda', 'projectVeto', 'rerollDice'].includes(d.type)) {
          executeSkill(factionId, d.type, d.params);
        } else if (d.type === 'bribery' || d.type === 'merchant') {
          (await import('../../logic/bribery.js')).triggerMerchant(factionId);
        } else if (d.type) {
          executeAction(factionId, d.type, d.params);
        }
      } catch (e) { /* skip failed AI actions */ }
    }
  } catch (e) { /* AI turn error recovery */ }

  renderAllPanels();

  // Advance to next player
  if (nextPlayer()) {
    if (isCurrentPlayerAI()) {
      const nf = gameState.turnOrder[gameState.currentPlayerIndex];
      setTimeout(() => executeAITurn(nf), 400);
    }
  } else {
    // All done → bill phase
    gameState.phase = 'bill';
    gameState.currentBill = null;
    renderAllPanels();
  }
}
