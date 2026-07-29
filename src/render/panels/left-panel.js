// src/render/panels/left-panel.js
import { gameState } from '../../logic/state.js';
import { FACTION_NAMES, DEPT_NAMES, SEAT_TASK_NAMES_CN } from '../../logic/data/constants.js';
import { showAlert, showSelect, showSlider, showOpponentDetail } from '../modal.js';

let memberSortMode = 'loyalty'; // 'loyalty' | 'rank'

export function renderLeftPanel() {
  const el = document.getElementById('left-panel');
  if (!el) return;
  const opponents = Object.entries(gameState.factions).filter(([id]) => id !== gameState.playerFactionId);
  const pf = gameState.factions[gameState.playerFactionId];

  let h = '';

  // === 我的派系详情 ===
  h += '<div class="panel-section player-full"><h3>👤 我的派系 — ' + pf.leaderName + '</h3>';
  h += `<div class="stat-row">📊 影响力: <b>${pf.influence}</b> &nbsp;|&nbsp; 💰 资金: <b>${pf.funds}</b> &nbsp;|&nbsp; 🧱 通用: <b>${pf.genericResources || 0}</b></div>`;
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

  // 生效法案效果 + 可点击的置换入口
  if (gameState.activeBillEffects.length) {
    h += '<div class="panel-section bill-effects-box"><h4>📜 生效法案</h4>';
    for (const be of gameState.activeBillEffects) {
      const eff = be.effects;
      if (!be || !be.name || !eff) continue;
      const isPassed = be.name.includes('（通过）');
      const icon = isPassed ? '✅' : '❌';
      // Build description
      const descParts = [];
      if (eff.globalResourceBonus) descParts.push(`全体资源+${eff.globalResourceBonus}`);
      if (eff.govResourceBonus) descParts.push(`政府资源+${eff.govResourceBonus}`);
      if (eff.taskCostReduction) descParts.push(`任务消耗-${eff.taskCostReduction}`);
      if (eff.appointmentCostReduction) descParts.push(`任用消耗-${eff.appointmentCostReduction}`);
      if (eff.govPartyExchange) descParts.push('政府↔党委互通');
      if (eff.blockPublicSecurity) descParts.push('公安资源封锁');
      if (eff.disableResources) descParts.push('目标资源瘫痪');
      if (eff.partySchoolBonus) descParts.push('党校额外+1');
      if (eff.disciplineSuccessBoost) descParts.push('查处成功率↑');
      if (eff.banDisciplineAction) descParts.push('禁纪委行动');
      if (eff.propagandaToInfluence) descParts.push('宣传可换影响力');
      if (eff.propagandaToGeneric) descParts.push('宣传可换通用资源');
      if (eff.govOfficeToGeneric) descParts.push('办公厅可换通用');
      if (eff.publicSecurityAsGeneric) descParts.push('公安可当政府资源');

      h += `<div class="effect-item">${icon} ${be.name}：${descParts.join('，')}（剩${be.duration}轮）`;

      // Inline conversion buttons for actionable effects
      if (eff.propagandaToInfluence) {
        h += ` <button class="btn-effect-convert${(pf.resources.propaganda || 0) >= 2 ? '' : ' btn-disabled'}" data-action="convertPropaganda">宣传→影响(2:1)</button>`;
      }
      if (eff.propagandaToGeneric) {
        h += ` <button class="btn-effect-convert${(pf.resources.propaganda || 0) >= 2 ? '' : ' btn-disabled'}" data-action="convertPropagandaToGeneric">宣传→通用(2:1)</button>`;
      }
      if (eff.govPartyExchange) {
        h += ` <button class="btn-effect-convert" data-action="convertGovParty">政府↔党委(1:1)</button>`;
      }
      if (eff.govOfficeToGeneric) {
        h += ` <button class="btn-effect-convert" data-action="convertGovOfficeToGeneric">办公厅→通用(1:1)</button>`;
      }
      if (eff.publicSecurityAsGeneric) {
        h += ` <button class="btn-effect-convert${(pf.resources.publicSecurity || 0) >= 1 ? '' : ' btn-disabled'}" data-action="convertEmergency">公安→政府(1:1)</button>`;
      }

      h += '</div>';
    }
    h += '</div>';
  }

  // 当前事件效果（事件也可能有置换能力）
  if (gameState.currentEvent && gameState.currentEvent.effects) {
    const evEff = gameState.currentEvent.effects;
    const evParts = [];
    if (evEff.propagandaToGeneric) evParts.push('宣传可换通用资源');
    if (evEff.publicSecurityAsGeneric) evParts.push('公安可当政府资源');
    if (evEff.govPartyExchange) evParts.push('政府↔党委互通');
    if (evEff.propagandaToInfluence) evParts.push('宣传可换影响力');
    if (evEff.govOfficeToGeneric) evParts.push('办公厅可换通用');
    if (evParts.length) {
      h += '<div class="panel-section bill-effects-box"><h4>⚡ 当前事件效果</h4>';
      h += `<div class="effect-item">📋 ${gameState.currentEvent.name}：${evParts.join('，')}`;

      if (evEff.propagandaToInfluence) {
        h += ` <button class="btn-effect-convert${(pf.resources.propaganda || 0) >= 2 ? '' : ' btn-disabled'}" data-action="convertPropaganda">宣传→影响(2:1)</button>`;
      }
      if (evEff.propagandaToGeneric) {
        h += ` <button class="btn-effect-convert${(pf.resources.propaganda || 0) >= 2 ? '' : ' btn-disabled'}" data-action="convertPropagandaToGeneric">宣传→通用(2:1)</button>`;
      }
      if (evEff.govPartyExchange) {
        h += ` <button class="btn-effect-convert" data-action="convertGovParty">政府↔党委(1:1)</button>`;
      }
      if (evEff.govOfficeToGeneric) {
        h += ` <button class="btn-effect-convert" data-action="convertGovOfficeToGeneric">办公厅→通用(1:1)</button>`;
      }
      if (evEff.publicSecurityAsGeneric) {
        h += ` <button class="btn-effect-convert${(pf.resources.publicSecurity || 0) >= 1 ? '' : ' btn-disabled'}" data-action="convertEmergency">公安→政府(1:1)</button>`;
      }

      h += '</div></div>';
    }
  }

  // 正在攻略的席位
  const mySeats = gameState.npcSeats.filter(s => s.visitorId === gameState.playerFactionId && !s.lockedById);
  if (mySeats.length) {
    h += '<div class="active-seats-section"><h4>🎯 正在攻略的席位</h4>';
    for (const s of mySeats) {
      const taskName = SEAT_TASK_NAMES_CN[s.task.type] || s.task.type;
      const deptName = DEPT_NAMES[s.task.resourceType] || s.task.resourceType;
      const canComplete = s.visitedOnTurn !== gameState.turn;
      const totalRes = Object.values(pf.resources).reduce((a, b) => a + b, 0) + (pf.genericResources || 0);
const hasRes = s.task.resourceType === 'any'
        ? totalRes >= s.task.cost
        : (pf.resources[s.task.resourceType] || 0) + (pf.genericResources || 0) >= s.task.cost;
      let statusText;
      if (!canComplete) statusText = '⏳下轮可完成';
      else if (!hasRes) statusText = `❌资源不足(需${s.task.cost}${deptName})`;
      else statusText = '✅可完成';
      h += `<div class="active-seat-row">
        <div class="active-seat-name">${s.name} · ${taskName}</div>
        <div class="active-seat-cost">💰 ${s.task.cost} ${deptName} &nbsp;|&nbsp; ⏰ 剩余 ${s.roundsRemaining} 轮 &nbsp;|&nbsp; ${statusText}</div>
      </div>`;
    }
    h += '</div>';
  }

  // 成员列表
  const rankWeight = { '正厅': 5, '副厅': 4, '正处': 3, '副处': 2 };
  const sorted = [...pf.members].sort((a, b) => {
    if (memberSortMode === 'loyalty') {
      if (b.loyalty !== a.loyalty) return b.loyalty - a.loyalty;
      return (rankWeight[b.rank] || 0) - (rankWeight[a.rank] || 0);
    } else {
      if (b.rank !== a.rank) return (rankWeight[b.rank] || 0) - (rankWeight[a.rank] || 0);
      return b.loyalty - a.loyalty;
    }
  });
  h += `<div class="member-section"><h4>👥 派系成员 (${pf.members.length}人)
    <span class="sort-btns">
      <button class="sort-btn${memberSortMode === 'loyalty' ? ' sort-active' : ''}" data-sort="loyalty">忠↓</button>
      <button class="sort-btn${memberSortMode === 'rank' ? ' sort-active' : ''}" data-sort="rank">级↓</button>
    </span></h4>`;
  for (const m of sorted) {
    const statusIcon = m.investigationStatus === 'evidence' ? '🔴' : m.investigationStatus === 'suspect' ? '🟡' : '🟢';
    const questTraits = ['小孩升学', '购买新房', '安排工作', '政治追求', '结识贵人'];
    const displayTraits = m.traits.filter(t => !questTraits.includes(t));
    const traits = displayTraits.slice(0, 3).join(' · ');
    h += `<div class="member-row">
      <div class="member-name"><span class="avatar-sq av-sm av-dept-${m.dept}">${m.name[0]}</span>${statusIcon} ${m.name} <span class="member-rank">${m.rank}</span></div>
      <div class="member-dept">${DEPT_NAMES[m.dept] || m.dept} · ${m.position}</div>
      <div class="member-loyalty">忠: ${m.loyalty}/9 ${traits ? '| ' + traits : ''}</div>
    </div>`;
  }
  h += '</div></div>';

  // === 对手派系 ===
  h += '<div class="panel-section"><h3>对手派系</h3>';
  for (const [fid, f] of opponents) {
    const active = fid === gameState.turnOrder[gameState.currentPlayerIndex];
    h += `<div class="opponent-row ${active ? 'active' : ''}" data-faction="${fid}">
      <div class="opponent-name">${FACTION_NAMES[fid]} · ${f.leaderName}</div>
      <div class="opponent-seats">🔒${f.lockedSeats}席 📊${f.influence}影 🔴${f.disciplineMarks}标</div>
    </div>`;
  }
  h += '</div>';

  el.innerHTML = h;

  // Opponent row click → show detail
  el.querySelectorAll('.opponent-row').forEach(row => {
    row.addEventListener('click', async () => {
      const fid = row.dataset.faction;
      if (fid) await showOpponentDetail(fid);
    });
  });

  // Sort buttons
  el.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      memberSortMode = btn.dataset.sort;
      (await import('../screens/game-screen.js')).renderAllPanels();
    });
  });

  // Bind inline conversion buttons in bill effects
  el.querySelectorAll('.btn-effect-convert').forEach(btn => {
    btn.addEventListener('click', async () => {
      const action = btn.dataset.action;
      const pf = gameState.factions[gameState.playerFactionId];
      switch (action) {
        case 'convertPropaganda': {
          if ((pf.resources.propaganda || 0) < 2) { await showAlert('宣传资源不足（需2）'); break; }
          pf.resources.propaganda -= 2;
          pf.influence += 1;
          await showAlert('已兑换：2宣传资源 → 1影响力');
          (await import('../screens/game-screen.js')).renderAllPanels();
          break;
        }
        case 'convertPropagandaToGeneric': {
          if ((pf.resources.propaganda || 0) < 2) { await showAlert('宣传资源不足（需2）'); break; }
          pf.resources.propaganda -= 2;
          pf.genericResources = (pf.genericResources || 0) + 1;
          await showAlert('已兑换：2宣传资源 → 1通用资源');
          (await import('../screens/game-screen.js')).renderAllPanels();
          break;
        }
        case 'convertGovParty': {
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
          await showAlert(`已兑换：${amt}${DEPT_NAMES[from] || from} → ${DEPT_NAMES[to] || to}`);
          (await import('../screens/game-screen.js')).renderAllPanels();
          break;
        }
        case 'convertGovOfficeToGeneric': {
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
          (await import('../screens/game-screen.js')).renderAllPanels();
          break;
        }
        case 'convertEmergency': {
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
          (await import('../screens/game-screen.js')).renderAllPanels();
          break;
        }
      }
    });
  });
}
