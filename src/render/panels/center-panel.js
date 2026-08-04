// src/render/panels/center-panel.js
import { gameState } from '../../logic/state.js';
import { executeAction, getMaxVisits } from '../../logic/actions.js';
import { executeSkill } from '../../logic/skills.js';
import { nextPlayer, isCurrentPlayerAI } from '../../logic/turn.js';
import { produceResources } from '../../logic/resources.js';
import { decideAIActions } from '../../logic/ai/decider.js';
import { ACTION_TYPES, MAX_ROUNDS } from '../../logic/data/constants.js';
import { renderAllPanels } from '../screens/game-screen.js';
import { showSlider, showSelect, showAlert, showSeatPicker, showAppointmentUI, showResourcePicker, resetAppointScroll } from '../modal.js';
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
  if (eff.housingResourceBonus) parts.push(`住建资源+${eff.housingResourceBonus}`);
  if (eff.sasacResourceBonus) parts.push(`国资委资源+${eff.sasacResourceBonus}`);
  if (eff.ndrcResourceBonus) parts.push(`发改委资源+${eff.ndrcResourceBonus}`);
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
  // 仅在turnOrder为空（游戏未初始化）时自动从dice推进到action
  if (gameState.phase === 'dice' && !gameState.turnOrder.length) {
    import('../../logic/turn.js').then(t => {
      if (gameState.phase === 'dice' && !gameState.turnOrder.length) {
        t.determineTurnOrder();
        renderAllPanels();
      }
    });
    el.innerHTML = '<div class="ai-display">⏳ 正在初始化...</div>';
    return;
  }
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
    const maxVisits = getMaxVisits(cf);
    const visitsLeft = maxVisits - (gameState.factions[cf].visitsThisTurn || 0);
    const pf = gameState.factions[cf];

    h += `<div class="action-card-grid">`;

    // 卡片1: 席位攻略
    h += `<div class="action-card"><div class="action-card-hd">🎯 席位攻略 <span>剩余拜访 ${visitsLeft}/${maxVisits}</span></div><div class="action-card-btns">`;
    h += btn('拜访席位', 'visitSeat', '消耗1影响，拜访人大代表，查看任务需求');
    h += btn('完成任务', 'completeTask', '消耗对应资源，锁定席位。刚拜访的席位下回合才能完成');
    h += btn('打探情报', 'scoutSeat', '消耗1影响，查看对手正在攻略的席位详情');
    h += btn('抢夺席位', 'stealSeat', '消耗2影响+双倍资源，直接抢走对手席位。需先打探。第一轮不可用');
    h += `</div></div>`;

    // 卡片2: 派系技能
    h += `<div class="action-card"><div class="action-card-hd">🏛️ 派系技能</div><div class="action-card-btns">`;
    h += btn('正面宣传', 'positivePropaganda', '消耗2宣传，选一种任务类型，本轮全体该类型消耗-1');
    h += btn('负面曝光', 'negativePropaganda', '消耗2宣传，目标派系影响力-2');
    h += btn('项目招标', 'projectBid', '消耗2住建，直接完成一个商人项目席位+免费拜访1次');
    h += btn('五年计划', 'fiveYearPlan', '消耗5发改，发起特殊经济投票。冷却3轮');
    h += btn('公安审讯', 'interrogate', '消耗2公安，目标下回合资源产出全部封锁');
    h += btn('突击检查', 'raid', '消耗3公安，目标当前攻略的席位直接失败');
    h += `</div></div>`;

    // 卡片3: 干部管理
    h += `<div class="action-card"><div class="action-card-hd">👥 干部管理</div><div class="action-card-btns">`;
    h += btn('查处干部', 'investigate', '消耗纪委标记，掷骰判定。证据确凿则暂停其资源产出');
    h += btn('干部任用', 'appoint', '消耗影响+组织部资源，提拔内部或招募外部无派系干部');
    h += btn('提升忠诚', 'boostLoyalty', '消耗10影响或1资金，提升选定成员忠诚度1点');
    h += btn('商人上门', 'merchant', '消耗2影响，随机获得资金，但有概率留下受贿标记');
    h += btn('资源变现', 'sasacCash', '消耗5资源变现为1笔资金');
    h += `</div></div>`;

    // 卡片4: 资源置换
    h += `<div class="action-card"><div class="action-card-hd">⚡ 资源置换</div><div class="action-card-btns">`;
    const govRes = pf.resources.govOffice || 0;
    const partyRes = pf.resources.partyOffice || 0;
    const billEffects = gameState.activeBillEffects.flatMap(e => Object.keys(e.effects));
    const eventEffects = gameState.currentEvent ? Object.keys(gameState.currentEvent.effects) : [];
    const allEffects = [...billEffects, ...eventEffects];
    h += `<button class="action-btn${govRes ? '' : ' btn-disabled'}" data-action="convertGovOffice">🏛️ 政府办→政府 (${govRes})</button>`;
    h += `<button class="action-btn${partyRes ? '' : ' btn-disabled'}" data-action="convertPartyOffice">🏛️ 党委办→党委 (${partyRes})</button>`;
    h += `<button class="action-btn${pf.influence >= 5 ? '' : ' btn-disabled'}" data-action="convertInfluence">💎 影响→通用 (5:1|现${pf.influence})</button>`;
    if (allEffects.includes('propagandaToInfluence')) h += '<button class="action-btn" data-action="convertPropaganda">📢 宣传→影响(2:1)</button>';
    if (allEffects.includes('propagandaToGeneric')) h += '<button class="action-btn" data-action="convertPropagandaToGeneric">📢 宣传→通用(2:1)</button>';
    if (allEffects.includes('govPartyExchange')) h += '<button class="action-btn" data-action="convertGovParty">🔄 政府↔党委(1:1)</button>';
    if (allEffects.includes('govOfficeToGeneric')) h += '<button class="action-btn" data-action="convertGovOfficeToGeneric">🏛️ 办公厅→通用(1:1)</button>';
    if (allEffects.includes('publicSecurityAsGeneric')) h += '<button class="action-btn" data-action="convertEmergency">🚔 公安→政府(1:1)</button>';
    h += `</div></div>`;

    h += `</div>`;
    h += '<div style="margin-top:14px"><button class="action-btn end-turn-btn" data-action="endTurn" style="width:100%;padding:14px;font-size:1em">✅ 完成行动</button></div>';
    h += '</div>';
  } else {
    h += `<div class="ai-display">⏳ 等待其他派系行动完成...</div>`;
  }
  h += '</div>';
  el.innerHTML = h;

  if (isPlayer) {
    bindButtons(el, cf);
  }
}

// === BILL PHASE (fixed — waits for player) ===
let _bargainsResolved = false;
async function renderBillPhase(el) {
  // Bill not yet drawn — draw it only once per round
  if (!gameState.currentBill) {
    if (_billResolving) return;
    _playerVoted = false;
    _aiVoteTriggered = false;
    _billResolving = false;
    _bargainsResolved = false;
    import('../../logic/bills.js').then(async m => {
      m.drawBill();
      // 生成外交消息
      const bargainMod = await import('../../logic/bargaining.js');
      bargainMod.generateBargains();
      el.innerHTML = '';
      renderBillPhase(el);
    });
    return;
  }

  // 有未回复的外交消息 → 显示消息界面
  if (!_bargainsResolved && !_playerVoted && !_billResolving) {
    const bargain = (await import('../../logic/bargaining.js')).getNextPendingBargain();
    if (bargain) {
      showBargainUI(el, bargain);
      return;
    } else {
      _bargainsResolved = true;
    }
  }

  // Player already voted — show waiting state
  if (_playerVoted || _billResolving) {
    const b = gameState.currentBill;
    el.innerHTML = `<div class="center-content"><div class="bill-document">
      <div class="bill-doc-header">中共汉东省委办公厅</div>
      <div class="bill-doc-title">${b.name}</div>
      <hr class="red-header-line">
      <div class="bill-doc-body">
        <p>${b.description || ''}</p>
        <p style="text-align:center;color:#8b1a1a;margin-top:1em;">⏳ 已投票，等待其他派系表决…</p>
      </div>
      <div class="bill-doc-footer">
        <span>支持 ${b.votes.support.length} 票</span>
        <span>反对 ${b.votes.oppose.length} 票</span>
        <span>弃权 ${b.votes.abstain.length} 票</span>
      </div>
    </div></div>`;
    return;
  }

  const bill = gameState.currentBill;
  let h = '<div class="center-content"><div class="bill-document">';
  h += `<div class="bill-doc-header">中共汉东省委办公厅</div>`;
  h += `<div class="bill-doc-title">${bill.name}</div>`;
  h += '<hr class="red-header-line">';
  h += `<div class="bill-doc-body">`;
  h += `<p>${bill.description || ''}</p>`;
  // Show what happens on pass/fail
  if (bill.passEffects) {
    const passEff = describeEffects(bill.passEffects);
    if (passEff) h += `<p class="bill-pass-note">✅ 若通过：${passEff}</p>`;
  }
  if (bill.failEffects && Object.keys(bill.failEffects).length) {
    const failEff = describeEffects(bill.failEffects);
    if (failEff) h += `<p class="bill-fail-note">❌ 若否决：${failEff}</p>`;
  }
  h += `<p class="bill-vote-hint">通过需票数过半</p>`;
  h += `</div>`;
  // Vote buttons INSIDE the document footer area
  h += '<div class="bill-doc-vote">';
  h += '<button class="bill-vote-btn support" id="bill-support">支持</button>';
  h += '<button class="bill-vote-btn oppose" id="bill-oppose">反对</button>';
  h += '<button class="bill-vote-btn abstain" id="bill-abstain">弃权</button>';
  h += '</div>';
  h += `<div class="bill-doc-stats">当前 — 支持 ${bill.votes.support.length} | 反对 ${bill.votes.oppose.length} | 弃权 ${bill.votes.abstain.length}</div>`;
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

  const stampText = { support: '同意', oppose: '反对', abstain: '弃权' };
  const stampBtnId = { support: 'bill-support', oppose: 'bill-oppose', abstain: 'bill-abstain' };

  // 盖章动画 — 挂在body上避免被panel裁剪
  const playStamp = (stance) => {
    return new Promise(resolve => {
      const btn = document.getElementById(stampBtnId[stance]);
      if (!btn) { resolve(); return; }
      const rect = btn.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const inkColor = stance === 'support' ? 'rgba(196,30,30,0.25)' : stance === 'oppose' ? 'rgba(74,85,104,0.18)' : 'rgba(154,140,108,0.18)';
      const sealColor = stance === 'support' ? '#c41e1e' : stance === 'oppose' ? '#4a5568' : '#9a8c6c';

      // 墨迹
      const ink = document.createElement('div');
      ink.style.cssText = `position:fixed;left:${cx - 40}px;top:${cy - 40}px;width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,${inkColor} 0%,transparent 70%);pointer-events:none;z-index:9998;transform:scale(0);opacity:1;`;
      document.body.appendChild(ink);
      requestAnimationFrame(() => {
        ink.style.transition = 'all 0.5s ease-out';
        ink.style.transform = 'scale(3)';
        ink.style.opacity = '0';
      });

      // 印章
      const seal = document.createElement('div');
      seal.style.cssText = `position:fixed;left:${cx - 40}px;top:${cy - 40}px;width:80px;height:80px;border:4px solid ${sealColor};border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-serif);font-size:1.6em;font-weight:bold;color:${sealColor};letter-spacing:0.1em;pointer-events:none;z-index:9999;transform:scale(3) rotate(-20deg);opacity:0;`;
      seal.style.fontFamily = "'Noto Serif SC', 'STSong', 'SimSun', serif";
      seal.textContent = stampText[stance] || '✓';
      document.body.appendChild(seal);
      requestAnimationFrame(() => {
        seal.style.transition = 'all 0.5s cubic-bezier(0.18,0.89,0.32,1.2)';
        seal.style.transform = 'scale(1) rotate(0deg)';
        seal.style.opacity = '0.85';
      });

      setTimeout(() => {
        document.body.removeChild(ink);
        document.body.removeChild(seal);
        resolve();
      }, 600);
    });
  };

  // Player vote → stamp animation then resolve
  const doPlayerVote = async (stance) => {
    if (_playerVoted || _billResolving) return;
    _playerVoted = true;
    _billResolving = true;
    await playStamp(stance);
    (await import('../../logic/bills.js')).castVote(gameState.playerFactionId, stance);
    renderAllPanels();

    // Short delay for visual feedback, then resolve
    setTimeout(async () => {
      gameState.phase = 'cleanup';  // MUST set BEFORE resolveBill to prevent event re-entry
      (await import('../../logic/bills.js')).resolveBill();
      renderAllPanels();

      setTimeout(async () => {
        const t = await import('../../logic/turn.js');
        // 每6轮触发一个全局随机事件
        if (gameState.turn % 6 === 0) {
          const evMod = await import('../../logic/events.js');
          const result = evMod.triggerGlobalEvent();
          if (result) await showAlert(`⚡ 随机事件\n\n${result.name}\n${result.detail}`);
        }
        t.enterCleanup();
        if (gameState.phase === 'gameOver') { renderAllPanels(); return; }
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
function btn(label, action, desc) { return `<button class="action-btn" data-action="${action}" data-tooltip="${desc || ''}">${label}</button>`; }

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
          const totalRes = Object.values(pf.resources).reduce((a, b) => a + b, 0) + (pf.genericResources || 0);
          const hasRes = s.task.resourceType === 'any'
            ? totalRes >= s.task.cost
            : (pf.resources[s.task.resourceType] || 0) + (pf.genericResources || 0) >= s.task.cost;
          let prefix;
          if (!canDo) prefix = '⏳';
          else if (!hasRes) prefix = '❌';
          else prefix = '✅';
          const status = !canDo ? '下轮可完成' : (!hasRes ? `资源不足(需${s.task.cost}${dname})` : '可完成');
          return { label: `${prefix} ${s.name} | ${tname} | ${s.task.cost}${dname} | ${status}`, value: s.id };
        });
        const sid = await showSelect('选择要完成的席位', opts);
        if (!sid) break;
        const seat = gameState.npcSeats.find(s => s.id === sid);
        if (seat && seat.task.resourceType === 'any') {
          // Apply task cost reduction
          let cost = seat.task.cost;
          for (const be of gameState.activeBillEffects) {
            if (be.effects.taskCostReduction && (!be.effects.taskType || be.effects.taskType === seat.task.type)) {
              cost = Math.max(1, cost - be.effects.taskCostReduction);
            }
          }
          const alloc = await showResourcePicker(cost, pf.resources, pf.genericResources || 0);
          if (!alloc) break;
          // Spend chosen resources
          for (const [key, amt] of Object.entries(alloc)) {
            if (key === 'generic') {
              pf.genericResources -= amt;
            } else {
              pf.resources[key] = (pf.resources[key] || 0) - amt;
            }
          }
          // Complete the seat
          seat.lockedById = factionId;
          seat.visitorId = null;
          seat.lockedOnTurn = gameState.turn;
          seat._pendingRelease = false;
          pf.lockedSeats++;
          gameState.roundLog.push({ factionId, action: 'completeTask', target: `${seat.name}`, result: '锁定成功' });
          await showAlert(`成功锁定${seat.name}！`);
        } else if (seat) {
          // Non-any task: handles resource spending with generic fallback
          const r = executeAction(factionId, ACTION_TYPES.COMPLETE_TASK, { seatId: sid });
          if (r.success) {
            await showAlert(r.message);
          } else {
            const deptRes = pf.resources[seat.task.resourceType] || 0;
            const genRes = pf.genericResources || 0;
            await showAlert(`${r.message}\n\n所需：${seat.task.cost} ${DEPT_NAMES[seat.task.resourceType] || seat.task.resourceType}\n持有：${deptRes} 部门资源 + ${genRes} 通用资源 = ${deptRes + genRes}`);
          }
        } else {
          await showAlert('席位不存在');
        }
        break;
      }
      case 'scoutSeat': {
        const sid = await showSeatPicker('打探对手席位 — 点击被对手攻略的席位');
        if (sid) {
          const r = executeAction(factionId, ACTION_TYPES.SCOUT_SEAT, { seatId: sid });
          const extra = r.data ? `\n任务: ${SEAT_TASK_NAMES_CN[r.data.task.type] || r.data.task.type}\n费用: ${r.data.task.cost} ${DEPT_NAMES[r.data.task.resourceType] || r.data.task.resourceType}\n攻略者: ${FACTION_NAMES_CN[r.data.visitorId] || r.data.visitorId}\n剩余: ${r.data.roundsLeft}轮` : '';
          await showAlert(r.message + extra);
        }
        break;
      }
      case 'stealSeat': {
        if (gameState.turn <= 1) { await showAlert('第一轮大家都在拜访，还不能抢夺席位'); break; }
        const occupied = gameState.npcSeats.filter(s =>
          s.visitorId && s.visitorId !== factionId && !s.lockedById
        );
        if (!occupied.length) { await showAlert('没有正在被攻略的席位'); break; }
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
          await showAlert('请先使用「打探对手席位」探查该席位，确认任务内容和攻略者后再抢夺。');
          break;
        }
        await showAlert(executeAction(factionId, ACTION_TYPES.STEAL_SEAT, { seatId: sid }).message);
        break;
      }
      case 'investigate': {
        const myMarks = gameState.factions[factionId].disciplineMarks;
        const targets = Object.entries(gameState.factions)
          .filter(([id]) => id !== factionId)
          .map(([id, f]) => ({ label: `${FACTION_NAMES_CN[id] || id} · ${f.leaderName}`, value: id }));
        const target = await showSelect('选择目标派系（纪委标记：' + myMarks + '）', targets);
        if (!target) break;
        const faction = gameState.factions[target];
        const members = faction.members.filter(m => !m.isUnderInvestigation);
        if (!members.length) { await showAlert('该派系没有可查处的干部'); break; }
        const costMap = { '副处': 1, '正处': 2, '副厅': 3, '正厅': 4 };
        const memberOpts = members.map(m => {
          const cost = costMap[m.rank] || '?';
          const can = myMarks >= cost;
          return { label: `${can ? '✅' : '❌'} ${m.name} · ${m.rank}（${cost}标记）`, value: m.id };
        });
        const mid = await showSelect('选择查处目标（当前标记：' + myMarks + '）', memberOpts);
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
      case 'sasacCash': {
        const pf = gameState.factions[factionId];
        const choices = [
          { label: `国资委: ${pf.resources.sasac || 0}`, value: 'sasac', amt: pf.resources.sasac || 0 },
          { label: `住建厅: ${pf.resources.housing || 0}`, value: 'housing', amt: pf.resources.housing || 0 },
          { label: `发改委: ${pf.resources.ndrc || 0}`, value: 'ndrc', amt: pf.resources.ndrc || 0 },
          { label: `财政厅: ${pf.resources.finance || 0}`, value: 'finance', amt: pf.resources.finance || 0 },
          { label: `通用资源: ${pf.genericResources || 0}`, value: 'generic', amt: pf.genericResources || 0 }
        ].filter(c => c.amt >= 5);
        if (!choices.length) { await showAlert('没有足够的资源（需5单位）'); break; }
        const dept = await showSelect('选择变现资源（5单位=1笔资金）', choices.map(c => ({ label: c.label, value: c.value })));
        if (!dept) break;
        const amt = choices.find(c => c.value === dept)?.amt || 0;
        const maxBatches = Math.floor(amt / 5);
        const batches = await showSlider(`变现几笔？（每笔5${dept === 'generic' ? '通用' : DEPT_NAMES[dept] || dept}=1资金）`, maxBatches, 1);
        if (batches) {
          if (dept === 'generic') pf.genericResources -= batches * 5;
          else pf.resources[dept] -= batches * 5;
          pf.funds += batches;
          await showAlert(`已变现${batches}笔，获得${batches}笔资金`);
        }
        break;
      }
      case 'appoint': {
        resetAppointScroll();
        while (true) {
          const result = await showAppointmentUI(factionId);
          if (!result) break;
          const m = await import('../../logic/loyalty.js');
          if (result.action === 'promote') {
            await showAlert(m.promoteMember(factionId, result.memberId).message);
          } else if (result.action === 'recruit') {
            await showAlert(m.recruitOfficial(factionId, result.officialName, result.officialDept, result.targetRank, result.targetTitle).message);
          }
          renderAllPanels();
        }
        break;
      }
      case 'boostLoyalty': {
        const faction = gameState.factions[factionId];
        const opts = faction.members.map(m => {
          const questHint = m.personalQuests.length > 0 ? ` 📋${m.personalQuests[0]}` : '';
          return { label: `${m.name} · ${m.rank} · 忠${m.loyalty}/9${questHint}`, value: m.id };
        });
        const mid = await showSelect('提升忠诚度 / 完成个人追求', opts);
        if (!mid) break;
        const member = faction.members.find(m => m.id === mid);
        const choices = [
          { label: `消耗10影响力（当前${faction.influence}）`, value: 'influence' },
          { label: `消耗1笔资金（当前${faction.funds}笔）`, value: 'funds' }
        ];
        if (member && member.personalQuests.length > 0) {
          const q = member.personalQuests[0];
          const qcost = { '小孩升学': '1教育', '购买新房': '1住建', '安排工作': '1国资委', '政治追求': '晋升', '结识贵人': '2任意' }[q] || '?';
          choices.unshift({ label: `📋 完成「${q}」（${qcost}）`, value: 'quest' });
        }
        const method = await showSelect('选择方式', choices);
        if (!method) break;
        const m = await import('../../logic/loyalty.js');
        if (method === 'quest') {
          await showAlert(m.completePersonalQuest(factionId, mid).message);
        } else {
          await showAlert(m.boostLoyalty(factionId, mid, method).message);
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
      case 'convertPropagandaToGeneric': {
        const pf = gameState.factions[factionId];
        if ((pf.resources.propaganda || 0) < 2) { await showAlert('宣传资源不足（2宣传→1通用资源）'); break; }
        pf.resources.propaganda -= 2;
        pf.genericResources = (pf.genericResources || 0) + 1;
        renderAllPanels();
        break;
      }
      case 'convertGovParty': {
        const pf = gameState.factions[factionId];
        const allGovDepts = ['govOffice','ndrc','sasac','publicSecurity','hrss','finance','housing','education','audit'];
        const allPartyDepts = ['partyOffice','organization','propaganda','discipline','legalAffairs'];
        const isGov = (d) => allGovDepts.includes(d);
        const deptLabel = (d) => `${DEPT_NAMES[d] || d}:${pf.resources[d] || 0}`;
        const srcGov = allGovDepts.filter(d => (pf.resources[d] || 0) > 0);
        const srcParty = allPartyDepts.filter(d => (pf.resources[d] || 0) > 0);
        if (!srcGov.length && !srcParty.length) { await showAlert('没有可兑换的资源'); break; }
        const allFrom = [...srcGov.map(d => ({ label: `政府·${deptLabel(d)}`, value: d })),
                         ...srcParty.map(d => ({ label: `党委·${deptLabel(d)}`, value: d }))];
        const from = await showSelect('选择来源部门（只能用已有资源）', allFrom);
        if (!from) break;
        const toList = (isGov(from) ? allPartyDepts : allGovDepts).map(d => ({ label: deptLabel(d), value: d }));
        const to = await showSelect('选择目标部门', toList);
        if (!to) break;
        const maxAmt = pf.resources[from] || 0;
        const amt = await showSlider('兑换数量', maxAmt, 1);
        if (!amt) break;
        pf.resources[from] -= amt;
        pf.resources[to] = (pf.resources[to] || 0) + amt;
        renderAllPanels();
        break;
      }
      // 政府办公厅→任意政府部门（始终可用）
      case 'convertGovOffice': {
        const pf = gameState.factions[factionId];
        const maxAmt = pf.resources.govOffice || 0;
        if (maxAmt < 1) { await showAlert('政府办公厅资源不足'); break; }
        const govDepts = ['ndrc','sasac','publicSecurity','hrss','finance','housing','education','audit'];
        const opts = govDepts.map(d => ({ label: `${DEPT_NAMES[d] || d}:${pf.resources[d] || 0}`, value: d }));
        const to = await showSelect('政府办公厅→哪个政府部门(1:1)', opts);
        if (!to) break;
        const amt = await showSlider('兑换数量', maxAmt, 1);
        if (!amt) break;
        pf.resources.govOffice -= amt;
        pf.resources[to] = (pf.resources[to] || 0) + amt;
        await showAlert(`已兑换！${amt}政府办公厅→${DEPT_NAMES[to] || to}`);
        renderAllPanels();
        break;
      }
      // 党委办公厅→任意党委部门（始终可用）
      case 'convertPartyOffice': {
        const pf = gameState.factions[factionId];
        const maxAmt = pf.resources.partyOffice || 0;
        if (maxAmt < 1) { await showAlert('党委办公厅资源不足'); break; }
        const partyDepts = ['organization','propaganda','discipline','legalAffairs'];
        const opts = partyDepts.map(d => ({ label: `${DEPT_NAMES[d] || d}:${pf.resources[d] || 0}`, value: d }));
        const to = await showSelect('党委办公厅→哪个党委部门(1:1)', opts);
        if (!to) break;
        const amt = await showSlider('兑换数量', maxAmt, 1);
        if (!amt) break;
        pf.resources.partyOffice -= amt;
        pf.resources[to] = (pf.resources[to] || 0) + amt;
        await showAlert(`已兑换！${amt}党委办公厅→${DEPT_NAMES[to] || to}`);
        renderAllPanels();
        break;
      }
      // 办公厅→通用（仅法案/事件触发时可用）
      case 'convertGovOfficeToGeneric': {
        const pf = gameState.factions[factionId];
        const choices = [];
        if ((pf.resources.govOffice || 0) > 0) choices.push({ label: `政府办公厅→通用(1:1) 当前${pf.resources.govOffice}`, value: 'govOffice' });
        if ((pf.resources.partyOffice || 0) > 0) choices.push({ label: `党委办公厅→通用(1:1) 当前${pf.resources.partyOffice}`, value: 'partyOffice' });
        if (!choices.length) { await showAlert('没有办公厅资源'); break; }
        const type = await showSelect('选择办公厅类型', choices);
        if (!type) break;
        const maxAmt = pf.resources[type] || 0;
        const amt = await showSlider('兑换数量', maxAmt, 1);
        if (!amt) break;
        pf.resources[type] -= amt;
        pf.genericResources = (pf.genericResources || 0) + amt;
        await showAlert(`已兑换！${amt}${type === 'govOffice' ? '政府' : '党委'}办公厅→${amt}通用资源`);
        renderAllPanels();
        break;
      }
      case 'convertEmergency': {
        const pf = gameState.factions[factionId];
        const maxAmt = pf.resources.publicSecurity || 0;
        if (maxAmt < 1) { await showAlert('公安资源不足'); break; }
        const govDepts = ['govOffice','ndrc','sasac','hrss','finance','housing','education','audit'];
        const opts = govDepts.map(d => ({ label: `${DEPT_NAMES[d] || d}:${pf.resources[d] || 0}`, value: d }));
        const to = await showSelect('公安→哪个政府资源(1:1)', opts);
        if (!to) break;
        const amt = await showSlider('兑换数量', maxAmt, 1);
        if (!amt) break;
        pf.resources.publicSecurity -= amt;
        pf.resources[to] = (pf.resources[to] || 0) + amt;
        renderAllPanels();
        break;
      }
      case 'convertInfluence': {
        const pf = gameState.factions[factionId];
        const maxAmt = Math.floor(pf.influence / 5);
        if (maxAmt < 1) { await showAlert('影响力不足（5影响力→1通用资源）'); break; }
        const batches = await showSlider('兑换几份？（每份5影响力=1通用）', maxAmt, 1);
        if (!batches) break;
        pf.influence -= batches * 5;
        pf.genericResources = (pf.genericResources || 0) + batches;
        await showAlert(`已兑换！${batches * 5}影响力 → ${batches}通用资源`);
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
    endTurnFlow();
  }
}

async function endTurnFlow() {
  // 最后一轮跳过法案投票，直接结算
  if (gameState.turn >= MAX_ROUNDS) {
    const t = await import('../../logic/turn.js');
    t.enterCleanup();
    renderAllPanels();
    return;
  }
  gameState.phase = 'bill';
  gameState.currentBill = null;
  _playerVoted = false;
  _aiVoteTriggered = false;
  _billResolving = false;
  renderAllPanels();
}

// === AI TURN ===
// === 外交消息 UI ===
function showBargainUI(el, bargain) {
  const stanceLabel = bargain.preferStance === 'support' ? '✅ 支持' : '❌ 反对';
  const hints = [
    '滴水之恩，涌泉相报。',
    '君子一言，驷马难追。',
    '投我以桃，报之以李。',
    '己所不欲，勿施于人。',
    '来而不往，非礼也。',
    '与人方便，自己方便。',
    '多个朋友多条路，多个冤家多堵墙。',
    '话不投机半句多。',
    '宁可得罪君子，不可得罪小人。',
    '局势瞬息万变，三思而后行。',
    '一言既出，如白染皂。',
    '明者因时而变，知者随事而制。',
  ];
  const hint = hints[Math.floor(Math.random() * hints.length)];

  el.innerHTML = `<div class="center-content"><div class="bargain-card">
    <div class="bargain-from">📨 ${bargain.leaderName}</div>
    <div class="bargain-msg">"${bargain.message}"</div>
    <div class="bargain-stance">希望你在本轮法案投：<b>${stanceLabel}</b></div>
    <div class="bargain-btns">
      <button class="bargain-btn accept" id="bargain-accept">🤝 接受</button>
      <button class="bargain-btn reject" id="bargain-reject">👎 拒绝</button>
    </div>
    <div class="bargain-hint">${hint}</div>
  </div></div>`;

  const handleChoice = async (accepted) => {
    const bargainMod = await import('../../logic/bargaining.js');
    bargainMod.resolveBargain(bargain.factionId, accepted);
    el.innerHTML = '';
    renderBillPhase(el);
  };

  el.querySelector('#bargain-accept')?.addEventListener('click', () => handleChoice(true));
  el.querySelector('#bargain-reject')?.addEventListener('click', () => handleChoice(false));
}

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
    endTurnFlow();
  }
}
