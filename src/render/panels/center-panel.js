// src/render/panels/center-panel.js
import { gameState } from '../../logic/state.js';
import { executeAction } from '../../logic/actions.js';
import { executeSkill } from '../../logic/skills.js';
import { nextPlayer, isCurrentPlayerAI } from '../../logic/turn.js';
import { produceResources } from '../../logic/resources.js';
import { decideAIActions } from '../../logic/ai/decider.js';
import { ACTION_TYPES } from '../../logic/data/constants.js';
import { renderAllPanels } from '../screens/game-screen.js';
import { showPrompt, showSelect, showAlert, showSeatPicker } from '../modal.js';
import { FACTION_NAMES_CN, DEPT_NAMES } from '../../logic/data/constants.js';

let _playerVoted = false;
let _billResolveTimeout = null;

export function renderCenterPanel() {
  const el = document.getElementById('center-panel');
  if (!el) return;

  // === Bill phase ===
  if (gameState.phase === 'bill') {
    renderBillPhase(el);
    return;
  }

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

// === BILL PHASE (fixed — waits for player) ===
function renderBillPhase(el) {
  _playerVoted = false;

  if (!gameState.currentBill) {
    import('../../logic/bills.js').then(m => { m.drawBill(); renderBillPhase(el); });
    return;
  }

  const bill = gameState.currentBill;
  let h = '<div class="center-content"><div class="bill-phase">';
  h += `<div class="event-card"><div class="event-card-header">📜 法案投票 — 第${gameState.turn}轮</div>`;
  h += `<div class="event-card-body"><b>${bill.name}</b><br>${bill.description || ''}<br><small>通过需票数过半</small></div></div>`;
  h += '<div class="bill-vote-section"><h4>选择你的立场（必须投票）</h4>';
  h += '<div class="action-grid">';
  h += '<button class="action-btn support-btn" id="bill-support">✅ 支持</button>';
  h += '<button class="action-btn oppose-btn" id="bill-oppose">❌ 反对</button>';
  h += '<button class="action-btn abstain-btn" id="bill-abstain">⏸️ 弃权</button>';
  h += '</div></div>';
  h += `<div class="bill-vote-status">当前票数 — ✅${bill.votes.support.length} ❌${bill.votes.oppose.length} ⏸️${bill.votes.abstain.length}</div>`;
  h += '</div></div>';
  el.innerHTML = h;

  // AI votes immediately
  setTimeout(async () => {
    const billsMod = await import('../../logic/bills.js');
    for (const fid of gameState.turnOrder) {
      if (fid === gameState.playerFactionId) continue;
      const allVotes = [...bill.votes.support, ...bill.votes.oppose, ...bill.votes.abstain];
      if (allVotes.some(v => v.factionId === fid)) continue;
      billsMod.castVote(fid, ['support', 'oppose', 'abstain'][Math.floor(Math.random() * 3)]);
    }
    renderAllPanels();
  }, 300);

  // Player vote handlers — resolution happens after player votes
  const doPlayerVote = async (stance) => {
    if (_playerVoted) return;
    _playerVoted = true;
    (await import('../../logic/bills.js')).castVote(gameState.playerFactionId, stance);
    renderAllPanels();

    // Now resolve the bill
    setTimeout(async () => {
      (await import('../../logic/bills.js')).resolveBill();
      renderAllPanels();

      // Transition to next round
      setTimeout(async () => {
        const t = await import('../../logic/turn.js');
        t.enterCleanup();
        t.startNewRound();
        t.determineTurnOrder();
        renderAllPanels();
        // Auto-execute AI if first
        if (t.isCurrentPlayerAI()) {
          setTimeout(() => executeAITurn(gameState.turnOrder[gameState.currentPlayerIndex]), 400);
        }
      }, 600);
    }, 500);
  };

  el.querySelector('#bill-support')?.addEventListener('click', () => doPlayerVote('support'));
  el.querySelector('#bill-oppose')?.addEventListener('click', () => doPlayerVote('oppose'));
  el.querySelector('#bill-abstain')?.addEventListener('click', () => doPlayerVote('abstain'));
}

// === PLAYER ACTIONS (using custom modals) ===
function btn(label, action) { return `<button class="action-btn" data-action="${action}">${label}</button>`; }

function bindButtons(el, factionId) {
  el.querySelectorAll('.action-btn').forEach(b => {
    b.addEventListener('click', async () => {
      const action = b.dataset.action;
      if (action === 'endTurn') {
        executeAction(factionId, ACTION_TYPES.END_TURN);
        advanceAfterPlayer();
      } else {
        await handlePlayerAction(factionId, action);
        renderAllPanels();
      }
    });
  });
}

async function handlePlayerAction(factionId, action) {
  try {
    switch (action) {
      case 'visitSeat': {
        const sid = await showSeatPicker('拜访人大席位 — 点击一个空闲席位');
        if (sid) {
          const r = executeAction(factionId, ACTION_TYPES.VISIT_SEAT, { seatId: sid });
          await showAlert(r.message + (r.data ? '\n任务: ' + r.data.type + '\n费用: ' + r.data.cost + ' ' + r.data.resourceType : ''));
        }
        break;
      }
      case 'completeTask': {
        const sid = await showSeatPicker('完成席位任务 — 点击你正在攻略的席位');
        if (sid) {
          await showAlert(executeAction(factionId, ACTION_TYPES.COMPLETE_TASK, { seatId: sid }).message);
        }
        break;
      }
      case 'scoutSeat': {
        const sid = await showSeatPicker('打探对手席位 — 点击被对手攻略的席位');
        if (sid) {
          const r = executeAction(factionId, ACTION_TYPES.SCOUT_SEAT, { seatId: sid });
          const extra = r.data ? `\n任务: ${r.data.task.type}\n费用: ${r.data.task.cost}\n攻略者: ${r.data.visitorId}\n剩余: ${r.data.roundsLeft}轮` : '';
          await showAlert(r.message + extra);
        }
        break;
      }
      case 'stealSeat': {
        const sid = await showSeatPicker('抢夺席位 — 点击对手正在攻略的席位');
        if (sid) {
          await showAlert(executeAction(factionId, ACTION_TYPES.STEAL_SEAT, { seatId: sid }).message);
        }
        break;
      }
      case 'investigate': {
        const targets = Object.entries(gameState.factions)
          .filter(([id]) => id !== factionId)
          .map(([id, f]) => ({ label: `${FACTION_NAMES_CN[id] || id} · ${f.leaderName}`, value: id }));
        const target = await showSelect('选择目标派系', targets);
        if (!target) break;
        const faction = gameState.factions[target];
        const members = faction.members.filter(m => !m.isUnderInvestigation);
        if (!members.length) { await showAlert('该派系没有可查处的干部'); break; }
        const memberOpts = members.map(m => ({
          label: `${m.name} · ${m.rank}`,
          value: m.id
        }));
        const mid = await showSelect('选择查处目标', memberOpts);
        if (mid) await showAlert(executeAction(factionId, ACTION_TYPES.INVESTIGATE, { targetFactionId: target, memberId: mid }).message);
        break;
      }
      case 'interrogate': {
        const targets = Object.entries(gameState.factions)
          .filter(([id]) => id !== factionId)
          .map(([id, f]) => ({ label: `${FACTION_NAMES_CN[id] || id} · ${f.leaderName}`, value: id }));
        const target = await showSelect('审讯目标', targets);
        if (target) await showAlert(executeSkill(factionId, 'interrogate', { targetFactionId: target }).message);
        break;
      }
      case 'raid': {
        const targets = Object.entries(gameState.factions)
          .filter(([id]) => id !== factionId)
          .map(([id, f]) => ({ label: `${FACTION_NAMES_CN[id] || id} · ${f.leaderName}`, value: id }));
        const target = await showSelect('突击检查目标', targets);
        if (target) await showAlert(executeSkill(factionId, 'raid', { targetFactionId: target }).message);
        break;
      }
      case 'positivePropaganda': {
        const taskTypes = [
          { label: '安排子女入学', value: 'arrangeSchool' },
          { label: '安排国企工作', value: 'arrangeJob' },
          { label: '保释朋友', value: 'bailFriend' },
          { label: '促成商人项目', value: 'businessProject' },
          { label: '积累人脉', value: 'buildConnections' },
        ];
        const tt = await showSelect('指定任务类型', taskTypes);
        if (tt) await showAlert(executeSkill(factionId, 'positivePropaganda', { taskType: tt }).message);
        break;
      }
      case 'negativePropaganda': {
        const targets = Object.entries(gameState.factions)
          .filter(([id]) => id !== factionId)
          .map(([id, f]) => ({ label: `${FACTION_NAMES_CN[id] || id} · ${f.leaderName}`, value: id }));
        const target = await showSelect('负面曝光目标', targets);
        if (target) await showAlert(executeSkill(factionId, 'negativePropaganda', { targetFactionId: target }).message);
        break;
      }
      case 'projectBid':
        await showAlert(executeSkill(factionId, 'projectBid', {}).message);
        break;
      case 'fiveYearPlan':
        await showAlert(executeSkill(factionId, 'fiveYearPlan', {}).message);
        break;
      case 'sasacCash':
        await showAlert(executeSkill(factionId, 'sasacCash', {}).message);
        break;
      case 'appoint': {
        const dept = await showPrompt('部门ID (如 organization/publicSecurity/govOffice):');
        if (!dept) break;
        const rank = await showPrompt('职级 (副处/正处/副厅):');
        if (rank) {
          const m = await import('../../logic/loyalty.js');
          await showAlert(m.appointOfficial(factionId, dept, rank).message);
        }
        break;
      }
      case 'boostLoyalty': {
        const faction = gameState.factions[factionId];
        const opts = faction.members.map(m => ({
          label: `${m.name} · ${m.rank} · 忠诚${m.loyalty}`,
          value: m.id
        }));
        const mid = await showSelect('选择要提升忠诚度的成员', opts);
        if (mid) {
          const m = await import('../../logic/loyalty.js');
          await showAlert(m.boostLoyalty(factionId, mid, 'influence').message);
        }
        break;
      }
      case 'merchant': {
        const m = await import('../../logic/bribery.js');
        await showAlert(m.triggerMerchant(factionId).message);
        break;
      }
    }
  } catch (e) {
    await showAlert('错误: ' + e.message);
  }
}

// === TURN ADVANCEMENT ===
function advanceAfterPlayer() {
  if (nextPlayer()) {
    if (isCurrentPlayerAI()) {
      const cf = gameState.turnOrder[gameState.currentPlayerIndex];
      setTimeout(() => executeAITurn(cf), 400);
    }
    renderAllPanels();
  } else {
    gameState.phase = 'bill';
    gameState.currentBill = null;
    _playerVoted = false;
    renderAllPanels();
  }
}

// === AI TURN ===
async function executeAITurn(factionId) {
  try {
    const evMod = await import('../../logic/events.js');
    evMod.drawEvent(factionId);
    evMod.resolveEvent(factionId);

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

    const decisions = decideAIActions(factionId);
    for (const d of decisions) {
      try {
        if (['interrogate', 'raid', 'projectBid', 'fiveYearPlan', 'sasacCash', 'positivePropaganda', 'negativePropaganda'].includes(d.type)) {
          executeSkill(factionId, d.type, d.params);
        } else if (d.type === 'bribery' || d.type === 'merchant') {
          (await import('../../logic/bribery.js')).triggerMerchant(factionId);
        } else if (d.type) {
          executeAction(factionId, d.type, d.params);
        }
      } catch (e) { /* skip */ }
    }
  } catch (e) { /* recover */ }

  renderAllPanels();

  if (nextPlayer()) {
    if (isCurrentPlayerAI()) {
      setTimeout(() => executeAITurn(gameState.turnOrder[gameState.currentPlayerIndex]), 400);
    }
  } else {
    gameState.phase = 'bill';
    gameState.currentBill = null;
    _playerVoted = false;
    renderAllPanels();
  }
}
