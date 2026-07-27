// src/render/panels/center-panel.js
import { gameState } from '../../logic/state.js';
import { executeAction } from '../../logic/actions.js';
import { executeSkill } from '../../logic/skills.js';
import { nextPlayer, isCurrentPlayerAI } from '../../logic/turn.js';
import { produceResources } from '../../logic/resources.js';
import { decideAIActions } from '../../logic/ai/decider.js';
import { ACTION_TYPES } from '../../logic/data/constants.js';
import { renderAllPanels } from '../screens/game-screen.js';
import { showPrompt, showSelect, showAlert, showSeatPicker, showAppointmentUI } from '../modal.js';
import { FACTION_NAMES_CN, DEPT_NAMES, SEAT_TASK_NAMES_CN } from '../../logic/data/constants.js';

function describeEffects(eff) {
  const parts = [];
  if (eff.globalResourceBonus) parts.push(`全体资源+${eff.globalResourceBonus}`);
  if (eff.govResourceBonus) parts.push(`政府资源+${eff.govResourceBonus}`);
  if (eff.financeResourceBonus) parts.push(`财政资源+${eff.financeResourceBonus}`);
  if (eff.taskCostReduction) parts.push(`任务消耗-${eff.taskCostReduction}`);
  if (eff.appointmentCostReduction) parts.push(`任用消耗-${eff.appointmentCostReduction}`);
  if (eff.govPartyExchange) parts.push('跨部门互通');
  if (eff.blockPublicSecurity) parts.push('公安封锁');
  if (eff.disableResources) parts.push('资源瘫痪');
  if (eff.partySchoolBonus) parts.push('党校+1');
  if (eff.disciplineSuccessBoost) parts.push('查处强化');
  if (eff.banDisciplineAction) parts.push('禁纪委行动');
  if (eff.supporterInfluenceBonus) parts.push(`支持方影响力+${eff.supporterInfluenceBonus}`);
  if (eff.disciplineMarksBonus) parts.push(`纪委标记+${eff.disciplineMarksBonus}`);
  if (eff.governmentResourceBonus) parts.push(`政府资源+${eff.governmentResourceBonus}`);
  if (eff.propagandaToInfluence) parts.push('宣传换影响力');
  if (eff.govOfficeToGeneric) parts.push('办公厅换通用');
  if (eff.hrssResourcePenalty) parts.push(`人社资源-${eff.hrssResourcePenalty}`);
  if (eff.propagandaResourcePenalty) parts.push(`宣传资源-${eff.propagandaResourcePenalty}`);
  if (eff.partyResourcePenalty) parts.push(`党委资源-${eff.partyResourcePenalty}`);
  if (eff.financeVoteWeight) parts.push(`财政投票权重调整`);
  if (eff.payPartyResourceOrInfluence) parts.push('支付党委资源或影响力');
  if (eff.banOpinionGuide) parts.push('禁舆论引导');
  if (eff.govAppointmentCostIncrease) parts.push('任用消耗增加');
  if (eff.supporterPropagandaPenalty) parts.push('宣传方资源惩罚');
  if (eff.immunityAuditStorm) parts.push('免疫审计风暴');
  return parts.join('，');
}

let _playerVoted = false;
let _aiVoteTriggered = false;
let _billResolving = false;

export function renderCenterPanel() {
  const el = document.getElementById('center-panel');
  if (!el) return;

  // === Bill phase ===
  if (gameState.phase === 'bill') {
    renderBillPhase(el);
    return;
  }

  // === Action phase ===
  if (gameState.phase !== 'action' || !gameState.turnOrder.length) {
    el.innerHTML = ''; return;
  }
  const cf = gameState.turnOrder[gameState.currentPlayerIndex];
  if (!cf) { el.innerHTML = ''; return; }
  const isPlayer = cf === gameState.playerFactionId;
  let h = '<div class="center-content">';

  if (gameState.currentEvent) {
    const ev = gameState.currentEvent;
    h += `<div class="event-card"><div class="event-card-header">📋 ${ev.name}</div><div class="event-card-body">${ev.description}</div></div>`;
  }

  if (isPlayer) {
    const visitsLeft = 2 - (gameState.factions[cf].visitsThisTurn || 0);
    h += '<div class="action-panel"><h3>选择行动（本轮剩余拜访次数：' + visitsLeft + '/2）</h3><div class="action-grid">';
    h += btn('拜访人大席位', 'visitSeat', '消耗1影响力，查看席位任务');
    h += btn('完成席位任务', 'completeTask', '消耗对应资源，锁定席位（本回合拜访的需下回合完成）');
    h += btn('打探对手席位', 'scoutSeat', '消耗2影响力，查看对手攻略的席位详情');
    h += btn('抢夺对手席位', 'stealSeat', '先打探(1影响)+抢夺(2影响)+双倍资源，直接锁定对手的席位');
    h += btn('查处对手干部', 'investigate', '消耗纪委标记，骰子判决定，查处对手干部');
    h += btn('公安审讯', 'interrogate', '消耗2公安资源，目标下回合无法产出');
    h += btn('突击检查', 'raid', '消耗3公安资源，使目标任务失败');
    h += btn('正面宣传', 'positivePropaganda', '消耗2宣传资源，指定任务全体消耗-1');
    h += btn('负面曝光', 'negativePropaganda', '消耗2宣传资源，目标影响力-2');
    h += btn('项目招标', 'projectBid', '消耗2住建资源，完成商人项目+免费拜访1次');
    h += btn('五年计划', 'fiveYearPlan', '消耗5发改资源(3轮CD)，发起经济投票');
    h += btn('资金变现', 'sasacCash', '消耗5国资委资源，获得1笔不留痕迹的资金');
    h += btn('干部任用', 'appoint', '消耗5-15组织部资源，扩张派系编制');
    h += btn('提升忠诚度', 'boostLoyalty', '消耗10影响力或1笔资金，提升成员忠诚+1');
    h += btn('商人上门', 'merchant', '消耗2影响力，随机获得资金（带风险）');
    // 资源置换按钮（根据当前生效效果动态显示）
    const billEffects = gameState.activeBillEffects.flatMap(e => Object.keys(e.effects));
    const eventEffects = gameState.currentEvent ? Object.keys(gameState.currentEvent.effects) : [];
    const allEffects = [...billEffects, ...eventEffects];
    if (allEffects.includes('propagandaToInfluence') || allEffects.includes('propagandaToGeneric')) h += '<button class="action-btn convert-btn" data-action="convertPropaganda">宣传→影响(2:1)</button>';
    if (allEffects.includes('govPartyExchange')) h += '<button class="action-btn convert-btn" data-action="convertGovParty">政府↔党委(1:1)</button>';
    if (allEffects.includes('govOfficeToGeneric')) h += '<button class="action-btn convert-btn" data-action="convertGovOffice">办公厅→通用(1:1)</button>';
    if (allEffects.includes('publicSecurityAsGeneric')) h += '<button class="action-btn convert-btn" data-action="convertEmergency">公安→政府(1:1)</button>';
    // 默认置换（始终可用）
    h += '<button class="action-btn convert-btn" data-action="convertInfluence">影响→资源(5:1)</button>';
    h += '<button class="action-btn convert-btn" data-action="convertOffice">办公厅兑换</button>';
    h += '<button class="action-btn end-turn-btn" data-action="endTurn" title="结束本回合行动">✅ 结束回合</button>';
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
  // Bill not yet drawn — draw it only once per round
  if (!gameState.currentBill) {
    if (_billResolving) return;  // Guard: don't redraw if already resolving
    _playerVoted = false;
    _aiVoteTriggered = false;
    _billResolving = false;
    import('../../logic/bills.js').then(m => { m.drawBill(); el.innerHTML = ''; renderBillPhase(el); });
    return;
  }

  // Player already voted — show waiting state with no re-trigger
  if (_playerVoted || _billResolving) {
    const b = gameState.currentBill;
    el.innerHTML = `<div class="center-content"><div class="bill-phase">
      <div class="event-card"><div class="event-card-header">📜 法案投票 — 第${gameState.turn}轮</div>
      <div class="event-card-body"><b>${b.name}</b><br>已投票，等待其他派系投票和结算...</div></div>
      <div class="bill-vote-status">支持 ${b.votes.support.length} | 反对 ${b.votes.oppose.length} | 弃权 ${b.votes.abstain.length}</div>
    </div></div>`;
    return;
  }

  const bill = gameState.currentBill;
  let h = '<div class="center-content"><div class="bill-phase">';
  h += `<div class="event-card"><div class="event-card-header">📜 法案投票 — 第${gameState.turn}轮</div>`;
  h += `<div class="event-card-body"><b>${bill.name}</b><br>${bill.description || ''}`;
  // Show what happens on pass/fail
  if (bill.passEffects) {
    const passEff = describeEffects(bill.passEffects);
    if (passEff) h += `<br><span class="bill-effect-pass">✅ 通过：${passEff}</span>`;
  }
  if (bill.failEffects && Object.keys(bill.failEffects).length) {
    const failEff = describeEffects(bill.failEffects);
    if (failEff) h += `<br><span class="bill-effect-fail">❌ 未通过：${failEff}</span>`;
  }
  h += `<br><small>通过需票数过半</small></div></div>`;
  h += '<div class="bill-vote-section"><h4>选择你的立场（必须投票）</h4>';
  h += '<div class="action-grid">';
  h += '<button class="action-btn support-btn" id="bill-support">✅ 支持</button>';
  h += '<button class="action-btn oppose-btn" id="bill-oppose">❌ 反对</button>';
  h += '<button class="action-btn abstain-btn" id="bill-abstain">⏸️ 弃权</button>';
  h += '</div></div>';
  h += `<div class="bill-vote-status">当前票数 — 支持 ${bill.votes.support.length} | 反对 ${bill.votes.oppose.length} | 弃权 ${bill.votes.abstain.length}</div>`;
  h += '</div></div>';
  el.innerHTML = h;

  // AI votes — trigger ONCE
  if (!_aiVoteTriggered) {
    _aiVoteTriggered = true;
    setTimeout(async () => {
      const billsMod = await import('../../logic/bills.js');
      for (const fid of gameState.turnOrder) {
        if (fid === gameState.playerFactionId) continue;
        const allVotes = [...bill.votes.support, ...bill.votes.oppose, ...bill.votes.abstain];
        if (allVotes.some(v => v.factionId === fid)) continue;
        billsMod.castVote(fid, ['support', 'oppose', 'abstain'][Math.floor(Math.random() * 3)]);
      }
      renderAllPanels();
    }, 100);
  }

  // Player vote → resolve immediately
  const doPlayerVote = async (stance) => {
    if (_playerVoted || _billResolving) return;
    _playerVoted = true;
    _billResolving = true;
    (await import('../../logic/bills.js')).castVote(gameState.playerFactionId, stance);
    renderAllPanels();

    // Short delay for visual feedback, then resolve
    setTimeout(async () => {
      gameState.phase = 'cleanup';  // MUST set BEFORE resolveBill to prevent event re-entry
      (await import('../../logic/bills.js')).resolveBill();
      renderAllPanels();

      setTimeout(async () => {
        const t = await import('../../logic/turn.js');
        t.enterCleanup();
        t.startNewRound();
        t.determineTurnOrder();
        renderAllPanels();
        if (t.isCurrentPlayerAI()) {
          setTimeout(() => executeAITurn(gameState.turnOrder[gameState.currentPlayerIndex]), 200);
        }
      }, 300);
    }, 200);
  };

  el.querySelector('#bill-support')?.addEventListener('click', () => doPlayerVote('support'));
  el.querySelector('#bill-oppose')?.addEventListener('click', () => doPlayerVote('oppose'));
  el.querySelector('#bill-abstain')?.addEventListener('click', () => doPlayerVote('abstain'));
}

// === PLAYER ACTIONS (using custom modals) ===
function btn(label, action, tip) { return `<button class="action-btn" data-action="${action}" title="${tip || ''}">${label}</button>`; }

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
          const detail = r.data ? '\n任务: ' + (SEAT_TASK_NAMES_CN[r.data.type] || r.data.type) + '\n费用: ' + r.data.cost + ' ' + (DEPT_NAMES[r.data.resourceType] || r.data.resourceType) : '';
          await showAlert(r.message + detail);
        }
        break;
      }
      case 'completeTask': {
        const mySeats = gameState.npcSeats.filter(s => s.visitorId === factionId && !s.lockedById);
        if (!mySeats.length) { await showAlert('你没有正在攻略的席位'); break; }
        const pf = gameState.factions[factionId];
        const opts = mySeats.map(s => {
          const tname = SEAT_TASK_NAMES_CN[s.task.type] || s.task.type;
          const dname = DEPT_NAMES[s.task.resourceType] || s.task.resourceType;
          const canDo = s.visitedOnTurn !== gameState.turn;
          const hasRes = s.task.resourceType === 'any'
            ? Object.values(pf.resources).reduce((a, b) => a + b, 0) >= s.task.cost
            : (pf.resources[s.task.resourceType] || 0) >= s.task.cost;
          let prefix;
          if (!canDo) prefix = '⏳';
          else if (!hasRes) prefix = '❌';
          else prefix = '✅';
          const status = !canDo ? '下轮可完成' : (!hasRes ? `资源不足(需${s.task.cost}${dname})` : '可完成');
          return { label: `${prefix} ${s.name} | ${tname} | ${s.task.cost}${dname} | ${status}`, value: s.id };
        });
        const sid = await showSelect('选择要完成的席位', opts);
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
        // Step 1: pick an occupied seat to scout (only show un-scouted ones)
        const occupied = gameState.npcSeats.filter(s =>
          s.visitorId && s.visitorId !== factionId && !s.lockedById
        );
        if (!occupied.length) { await showAlert('没有正在被攻略的席位'); break; }
        const unscouted = occupied.filter(s => !s.scoutedBy?.includes(factionId));
        // Also show already-scouted seats
        const opts = occupied.map(s => {
          const scouted = s.scoutedBy?.includes(factionId);
          const prefix = scouted ? '👁️' : '❓';
          const info = scouted
            ? `${(SEAT_TASK_NAMES_CN[s.task.type] || s.task.type)} | 双倍${s.task.cost * 2}${DEPT_NAMES[s.task.resourceType] || s.task.resourceType} | 直接锁定`
            : '未打探（需先花1影响力打探）';
          return { label: `${prefix} ${s.name} | ${info} | 剩${s.roundsRemaining}轮`, value: s.id };
        });
        const sid = await showSelect('抢夺席位（先打探→再抢夺，打探1影响+抢夺2影响+双倍资源）', opts);
        if (!sid) break;
        const seat = gameState.npcSeats.find(s => s.id === sid);
        if (!seat.scoutedBy?.includes(factionId)) {
          // Scout first
          const scoutR = executeAction(factionId, ACTION_TYPES.SCOUT_SEAT, { seatId: sid });
          if (!scoutR.success) { await showAlert(scoutR.message); break; }
          // Show what we found
          const data = scoutR.data;
          const ok = await showConfirm(`打探结果：\n攻略者：${data.visitorId}\n任务：${SEAT_TASK_NAMES_CN[data.task.type] || data.task.type}\n原费用：${data.task.cost} ${DEPT_NAMES[data.task.resourceType] || data.task.resourceType}\n剩余：${data.roundsLeft}轮\n\n抢夺 = 花双倍资源(${data.task.cost * 2})直接锁定该席位！\n确定要抢吗？`);
          if (!ok) break;
        }
        await showAlert(executeAction(factionId, ACTION_TYPES.STEAL_SEAT, { seatId: sid }).message);
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
        const result = await showAppointmentUI(factionId);
        if (!result) break;
        const m = await import('../../logic/loyalty.js');
        if (result.action === 'appoint') {
          await showAlert(m.appointOfficial(factionId, result.dept, result.rank).message);
        } else if (result.action === 'promote') {
          await showAlert(m.promoteMember(factionId, result.memberId).message);
        }
        break;
      }
      case 'boostLoyalty': {
        const faction = gameState.factions[factionId];
        const opts = faction.members.map(m => ({
          label: `${m.name} · ${m.rank} · 忠${m.loyalty}/9 · 💰10影响力 或 1资金`,
          value: m.id
        }));
        const mid = await showSelect('提升忠诚度（每+1需10影响力 或 1笔资金）', opts);
        if (mid) {
          const method = await showSelect('选择方式', [
            { label: `消耗10影响力（当前${faction.influence}）`, value: 'influence' },
            { label: `消耗1笔资金（当前${faction.funds}笔）`, value: 'funds' }
          ]);
          if (method) {
            const m = await import('../../logic/loyalty.js');
            await showAlert(m.boostLoyalty(factionId, mid, method).message);
          }
        }
        break;
      }
      case 'convertPropaganda': {
        const pf = gameState.factions[factionId];
        if ((pf.resources.propaganda || 0) < 2) { await showAlert('宣传资源不足（2宣传→1影响力）'); break; }
        pf.resources.propaganda -= 2;
        pf.influence += 1;
        renderAllPanels();
        break;
      }
      case 'convertGovParty': {
        const pf = gameState.factions[factionId];
        const isGov = (d) => ['govOffice','ndrc','sasac','publicSecurity','hrss','finance','housing','education','audit'].includes(d);
        const isParty = (d) => ['partyOffice','organization','propaganda','discipline','legalAffairs'].includes(d);
        const govDepts = Object.keys(pf.resources).filter(d => isGov(d) && pf.resources[d] > 0);
        const partyDepts = Object.keys(pf.resources).filter(d => isParty(d) && pf.resources[d] > 0);
        if (!govDepts.length && !partyDepts.length) { await showAlert('没有可兑换的资源'); break; }
        const allFrom = [...govDepts.map(d => ({ label: `政府·${d}:${pf.resources[d]}`, value: d })),
                         ...partyDepts.map(d => ({ label: `党委·${d}:${pf.resources[d]}`, value: d }))];
        const from = await showSelect('选择要兑换的来源部门', allFrom);
        if (!from) break;
        const toTargets = (isGov(from) ? partyDepts : govDepts).map(d => ({ label: `${d}:${pf.resources[d]}`, value: d }));
        const to = await showSelect('选择目标部门', toTargets.length ? toTargets : [{ label: '无可用目标', value: '' }]);
        if (!to) break;
        const amt = parseInt(await showPrompt('兑换数量:', '1')) || 0;
        if (amt <= 0 || (pf.resources[from] || 0) < amt) { await showAlert('资源不足'); break; }
        pf.resources[from] -= amt;
        pf.resources[to] = (pf.resources[to] || 0) + amt;
        renderAllPanels();
        break;
      }
      case 'convertGovOffice': {
        const pf = gameState.factions[factionId];
        if ((pf.resources.govOffice || 0) < 1) { await showAlert('政府办公厅资源不足'); break; }
        const govDepts = ['ndrc','sasac','publicSecurity','hrss','finance','housing','education','audit'];
        const opts = govDepts.map(d => ({ label: `${d}:${pf.resources[d] || 0}`, value: d }));
        const to = await showSelect('办公厅→哪个政府部门(1:1)', opts);
        if (!to) break;
        const amt = parseInt(await showPrompt('兑换数量:', '1')) || 0;
        if (amt <= 0 || (pf.resources.govOffice || 0) < amt) { await showAlert('资源不足'); break; }
        pf.resources.govOffice -= amt;
        pf.resources[to] = (pf.resources[to] || 0) + amt;
        renderAllPanels();
        break;
      }
      case 'convertEmergency': {
        const pf = gameState.factions[factionId];
        if ((pf.resources.publicSecurity || 0) < 1) { await showAlert('公安资源不足'); break; }
        const govDepts = ['govOffice','ndrc','sasac','hrss','finance','housing','education','audit'];
        const opts = govDepts.map(d => ({ label: `${d}:${pf.resources[d] || 0}`, value: d }));
        const to = await showSelect('公安→哪个政府资源(1:1)', opts);
        if (!to) break;
        const amt = parseInt(await showPrompt('兑换数量:', '1')) || 0;
        if (amt <= 0 || (pf.resources.publicSecurity || 0) < amt) { await showAlert('资源不足'); break; }
        pf.resources.publicSecurity -= amt;
        pf.resources[to] = (pf.resources[to] || 0) + amt;
        renderAllPanels();
        break;
      }
      case 'convertInfluence': {
        const pf = gameState.factions[factionId];
        if (pf.influence < 5) { await showAlert('影响力不足（5影响力→1通用资源）'); break; }
        pf.influence -= 5;
        pf.genericResources = (pf.genericResources || 0) + 1;
        await showAlert('已兑换！5影响力 → 1通用资源');
        renderAllPanels();
        break;
      }
      case 'convertOffice': {
        const pf = gameState.factions[factionId];
        const govOffice = pf.resources.govOffice || 0;
        const partyOffice = pf.resources.partyOffice || 0;
        if (!govOffice && !partyOffice) { await showAlert('没有办公厅资源'); break; }
        const choices = [];
        if (govOffice > 0) choices.push({ label: `政府办公厅→政府部门(1:1) 当前${govOffice}`, value: 'govOffice' });
        if (partyOffice > 0) choices.push({ label: `党委办公厅→党委部门(1:1) 当前${partyOffice}`, value: 'partyOffice' });
        const type = await showSelect('选择办公厅类型', choices);
        if (!type) break;
        const isParty = type === 'partyOffice';
        const targets = isParty ? ['organization','propaganda','discipline','legalAffairs'] : ['ndrc','sasac','publicSecurity','hrss','finance','housing','education','audit'];
        const to = await showSelect('目标部门', targets.map(d => ({ label: `${d}:${pf.resources[d] || 0}`, value: d })));
        if (!to) break;
        const amt = parseInt(await showPrompt('兑换数量:', '1')) || 0;
        if (amt <= 0 || (pf.resources[type] || 0) < amt) { await showAlert('资源不足'); break; }
        pf.resources[type] -= amt;
        pf.resources[to] = (pf.resources[to] || 0) + amt;
        renderAllPanels();
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
    _aiVoteTriggered = false;
    _billResolving = false;
    renderAllPanels();
  }
}

// === AI TURN ===
async function executeAITurn(factionId) {
  try {
    const evMod = await import('../../logic/events.js');
    evMod.drawEvent(factionId);
    evMod.resolveEvent(factionId);

    // Resources already produced at round start via produceAllResources()
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
    _aiVoteTriggered = false;
    _billResolving = false;
    renderAllPanels();
  }
}
