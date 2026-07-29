// Custom modal dialog to replace prompt() in Electron
export function showPrompt(title, defaultValue = '') {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">${title}</div>
        <input type="text" class="modal-input" value="${defaultValue}" id="modal-input" autofocus>
        <div class="modal-buttons">
          <button class="modal-btn modal-cancel">取消</button>
          <button class="modal-btn modal-ok">确定</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#modal-input');
    const ok = overlay.querySelector('.modal-ok');
    const cancel = overlay.querySelector('.modal-cancel');

    const cleanup = (val) => {
      overlay.remove();
      resolve(val);
    };

    ok.addEventListener('click', () => cleanup(input.value));
    cancel.addEventListener('click', () => cleanup(null));
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') cleanup(input.value);
      if (e.key === 'Escape') cleanup(null);
    });
    input.focus();
    input.select();
  });
}

export function showSelect(title, options) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const optionHtml = options.map((o, i) =>
      `<button class="select-option" data-idx="${i}">${o.label}</button>`
    ).join('');
    overlay.innerHTML = `
      <div class="modal-box modal-select">
        <div class="modal-title">${title}</div>
        <div class="select-options">${optionHtml}</div>
        <button class="modal-btn modal-cancel" style="margin-top:8px">取消</button>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.select-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        overlay.remove();
        resolve(options[idx].value);
      });
    });
    overlay.querySelector('.modal-cancel').addEventListener('click', () => {
      overlay.remove();
      resolve(null);
    });
  });
}

export function showAlert(message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">提示</div>
        <div class="modal-message">${message}</div>
        <div class="modal-buttons">
          <button class="modal-btn modal-ok">确定</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-ok').addEventListener('click', () => {
      overlay.remove();
      resolve();
    });
  });
}

export function showConfirm(message) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box">
        <div class="modal-title">确认</div>
        <div class="modal-message">${message}</div>
        <div class="modal-buttons">
          <button class="modal-btn modal-cancel">取消</button>
          <button class="modal-btn modal-ok">确定</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-ok').addEventListener('click', () => { overlay.remove(); resolve(true); });
    overlay.querySelector('.modal-cancel').addEventListener('click', () => { overlay.remove(); resolve(false); });
  });
}

// Appointment interface
import { gameState } from '../logic/state.js';
import { DEPARTMENTS } from '../logic/data/departments.js';
import { executeAction } from '../logic/actions.js';
import { SEAT_TASK_NAMES_CN, DEPT_NAMES, FACTION_NAMES_CN, TRAITS, PROMOTION_INFLUENCE_COST, RECRUIT_INFLUENCE_COST, RECRUIT_RESOURCE_COST, APPOINTMENT_COST } from '../logic/data/constants.js';

// Slider input for choosing an amount
export function showSlider(title, max, defaultValue = 1) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal-box" style="min-width:360px">
        <div class="modal-title">${title}</div>
        <div style="display:flex;align-items:center;gap:12px;margin:16px 0;">
          <input type="range" class="modal-slider" id="modal-slider" min="1" max="${max}" value="${Math.min(defaultValue, max)}" style="flex:1">
          <span class="modal-slider-val" id="modal-slider-val">${Math.min(defaultValue, max)}</span>
        </div>
        <div style="font-size:0.78em;color:var(--text-secondary);text-align:center">可兑换范围：1 ~ ${max}</div>
        <div class="modal-buttons">
          <button class="modal-btn modal-cancel">取消</button>
          <button class="modal-btn modal-ok">确定</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const slider = overlay.querySelector('#modal-slider');
    const valEl = overlay.querySelector('#modal-slider-val');
    slider.addEventListener('input', () => { valEl.textContent = slider.value; });
    overlay.querySelector('.modal-ok').addEventListener('click', () => { overlay.remove(); resolve(parseInt(slider.value)); });
    overlay.querySelector('.modal-cancel').addEventListener('click', () => { overlay.remove(); resolve(null); });
  });
}

// Resource picker for "any" type seat tasks — pick which resources to spend
export function showResourcePicker(cost, factionResources, genericResources) {
  return new Promise(resolve => {
    const entries = Object.entries(factionResources).filter(([, v]) => v > 0);
    const totalMax = entries.reduce((s, [, v]) => s + v, 0) + (genericResources || 0);
    if (totalMax < cost) { resolve(null); return; }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    let rowsHtml = '';
    if (genericResources > 0) {
      const genMax = Math.min(genericResources, cost);
      rowsHtml += `<div class="res-pick-row">
        <span class="res-pick-label">🧱 通用资源: ${genericResources}</span>
        <input type="range" class="res-pick-slider" min="0" max="${genMax}" value="0" data-key="generic">
        <span class="res-pick-val">0</span>
      </div>`;
    }
    for (const [dept, amt] of entries) {
      const deptName = DEPT_NAMES[dept] || dept;
      const deptMax = Math.min(amt, cost);
      rowsHtml += `<div class="res-pick-row">
        <span class="res-pick-label">${deptName}: ${amt}</span>
        <input type="range" class="res-pick-slider" min="0" max="${deptMax}" value="0" data-key="${dept}">
        <span class="res-pick-val">0</span>
      </div>`;
    }

    overlay.innerHTML = `
      <div class="modal-box modal-respick">
        <div class="modal-title">选择消耗的资源（需凑满 ${cost}）</div>
        <div class="res-pick-list">${rowsHtml}</div>
        <div class="res-pick-total">已选：<b id="res-pick-total">0</b> / ${cost}</div>
        <div class="modal-buttons">
          <button class="modal-btn modal-cancel">取消</button>
          <button class="modal-btn modal-ok" id="res-pick-ok" disabled>确定</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    const sliders = overlay.querySelectorAll('.res-pick-slider');
    const totalEl = overlay.querySelector('#res-pick-total');
    const okBtn = overlay.querySelector('#res-pick-ok');

    function updateTotal() {
      let total = 0;
      sliders.forEach(s => { total += parseInt(s.value); });
      totalEl.textContent = total;
      okBtn.disabled = total < cost;
    }

    sliders.forEach(s => {
      const valEl = s.parentElement.querySelector('.res-pick-val');
      s.addEventListener('input', () => { valEl.textContent = s.value; updateTotal(); });
    });

    overlay.querySelector('.modal-cancel').addEventListener('click', () => { overlay.remove(); resolve(null); });
    okBtn.addEventListener('click', () => {
      const allocation = {};
      sliders.forEach(s => {
        const v = parseInt(s.value);
        if (v > 0) allocation[s.dataset.key] = v;
      });
      overlay.remove();
      resolve(allocation);
    });
  });
}

// Seat picker
export function showSeatPicker(title, filterFn = null) {
  return new Promise(resolve => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    const seats = gameState.npcSeats;
    const playerId = gameState.playerFactionId;

    let gridHtml = '<div class="seat-grid">';
    for (const s of seats) {
      let cls = 'seat-cell';
      let icon = '⬜';
      let info = '';
      if (s.lockedById) {
        cls += ' seat-locked';
        icon = s.lockedById === playerId ? '🔒' : '🔴';
        info = `${s.lockedById === playerId ? '我的' : '已锁'}`;
      } else if (s.visitorId) {
        cls += ' seat-visiting';
        icon = s.visitorId === playerId ? '👁️' : '🟡';
        info = `${s.visitorId === playerId ? '攻略中' : '被攻略'}`;
      } else {
        cls += ' seat-free';
        icon = '🟢';
        info = '空闲';
      }
      const taskName = SEAT_TASK_NAMES_CN[s.task.type] || s.task.type;
      const deptName = DEPT_NAMES[s.task.resourceType] || s.task.resourceType;
      const detail = s.visitorId === playerId && s.revealed
        ? `\n${taskName}\n${s.task.cost} ${deptName}`
        : '';
      gridHtml += `<div class="${cls}" data-seat-id="${s.id}" title="${s.name}${detail}">
        <div class="seat-icon">${icon}</div>
        <div class="seat-name">${s.name}</div>
        <div class="seat-info">${info}</div>
      </div>`;
    }
    gridHtml += '</div>';

    overlay.innerHTML = `
      <div class="modal-box modal-seats">
        <div class="modal-title">${title}</div>
        <div class="seat-grid-wrapper">${gridHtml}</div>
        <div class="modal-buttons">
          <button class="modal-btn modal-cancel">取消</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.seat-cell').forEach(cell => {
      cell.addEventListener('click', () => {
        overlay.remove();
        resolve(cell.dataset.seatId);
      });
    });
    overlay.querySelector('.modal-cancel').addEventListener('click', () => {
      overlay.remove();
      resolve(null);
    });
  });
}

// === OPPONENT DETAIL (CLEAN VERSION) ===
export function showOpponentDetail(factionId) {
  return new Promise(resolve => {
    const faction = gameState.factions[factionId];
    const factionName = FACTION_NAMES_CN[factionId] || factionId;
    const playerId = gameState.playerFactionId;

    function isScouted(member) {
      return Array.isArray(member.scoutedQuestsBy) && member.scoutedQuestsBy.includes(playerId);
    }

    function loyaltyText(member) {
      if (!isScouted(member)) return '';
      if (member.loyalty >= 7) return ' 🟢高';
      if (member.loyalty >= 4) return ' 🟡中';
      return ' 🔴低';
    }

    let html = `<div class="opponent-detail"><h4>${factionName} · ${faction.leaderName}</h4>`;
    html += `<div class="opponent-stats">🔒 ${faction.lockedSeats}席 | 👥 ${faction.members.length}人</div>`;
    html += '<div class="opponent-members">';

    for (const m of faction.members) {
      const scouted = isScouted(m);
      html += `<div class="opponent-member-row">
        <span class="avatar-sq av-sm av-dept-${m.dept}">${m.name[0]}</span>
        <div class="om-info">
          <div class="om-name">${m.name} · ${m.rank}${loyaltyText(m)}</div>
          <div class="om-dept">${DEPT_NAMES[m.dept] || m.dept} · ${m.position}</div>`;

      if (scouted) {
        if (m.personalQuests.length > 0) {
          html += '<div class="om-quests">';
          for (const q of m.personalQuests) {
            const qcost = { '小孩升学': '1教育', '购买新房': '1住建', '安排工作': '1国资委', '结识贵人': '2任意' }[q] || '?';
            html += `<button class="btn-small btn-do-quest" data-fid="${factionId}" data-mid="${m.id}" data-quest="${q}">🎁 ${q}(${qcost})</button>`;
          }
          html += '</div>';
        } else {
          html += '<div style="color:var(--text-muted);font-size:0.75em;">无个人追求</div>';
        }
      } else {
        html += `<button class="btn-small btn-scout-quests" data-fid="${factionId}" data-mid="${m.id}">🔍 打探追求(1影响)</button>`;
      }

      html += '</div></div>';
    }

    html += '</div>';
    html += `<div class="om-actions"><button class="btn-small btn-bribe">💰 收买干部(资金)</button></div>`;
    html += '<button class="modal-btn modal-cancel" style="margin-top:10px;width:100%">关闭</button></div>';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box modal-opponent">${html}</div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('.modal-cancel').addEventListener('click', () => { overlay.remove(); resolve(null); });

    function refresh() {
      overlay.remove();
      import('../screens/game-screen.js').then(m => m.renderAllPanels());
      showOpponentDetail(factionId).then(resolve);
    }

    // Scout
    overlay.querySelectorAll('.btn-scout-quests').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const r = executeAction(playerId, 'scoutQuests', { targetFactionId: btn.dataset.fid, memberId: btn.dataset.mid });
        if (r.success) {
          const member = gameState.factions[btn.dataset.fid].members.find(m => m.id === btn.dataset.mid);
          if (member) {
            if (!Array.isArray(member.scoutedQuestsBy)) member.scoutedQuestsBy = [];
            if (!member.scoutedQuestsBy.includes(playerId)) member.scoutedQuestsBy.push(playerId);
          }
        }
        await showAlert(r.message);
        refresh();
      });
    });

    // Complete quest
    overlay.querySelectorAll('.btn-do-quest').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const questType = btn.dataset.quest;
        if (questType === '结识贵人') {
          const alloc = await showResourcePicker(2, gameState.factions[playerId].resources, gameState.factions[playerId].genericResources || 0);
          if (!alloc) return;
          const pf = gameState.factions[playerId];
          for (const [key, amt] of Object.entries(alloc)) {
            if (key === 'generic') pf.genericResources -= amt;
            else pf.resources[key] = (pf.resources[key] || 0) - amt;
          }
          const targetFaction = gameState.factions[btn.dataset.fid];
          const member = targetFaction?.members.find(m => m.id === btn.dataset.mid);
          if (member) {
            member.personalQuests.shift();
            member.completedQuests.push('结识贵人');
            member.loyalty = Math.max(0, member.loyalty - 3);
            if (member.loyalty <= 0) {
              targetFaction.members = targetFaction.members.filter(m => m.id !== btn.dataset.mid);
              member.loyalty = 4;
              member.traits = member.traits.filter(t => t !== '心腹嫡系' && t !== '利益共同体');
              member.id = `${playerId}_${member.name}`;
              gameState.factions[playerId].members.push(member);
              await showAlert(`良禽择木而栖，${member.name}已加入您的派系。`);
            } else {
              await showAlert(`${member.name}十分感谢您的帮助，来日有机会愿效犬马之劳。`);
            }
          }
          refresh();
          return;
        }
        const r = executeAction(playerId, 'completeEnemyQuest', { targetFactionId: btn.dataset.fid, memberId: btn.dataset.mid });
        await showAlert(r.message);
        refresh();
      });
    });

    // Bribe — find button, check if null, attach onclick
    const bribeBtn = overlay.querySelector('.btn-bribe');
    if (bribeBtn) {
      bribeBtn.style.outline = '2px solid red'; // DEBUG: confirm button found
      bribeBtn.onclick = async function(e) {
        e.stopPropagation();
        e.preventDefault();
        bribeBtn.textContent = '处理中...';
        try {
          const pf = gameState.factions[playerId];
          const members = faction.members.filter(m => m.name !== faction.leaderName).map(m => ({ label: `${m.name} · ${m.rank}`, value: m.id }));
          if (!members.length) { await showAlert('该派系没有可收买的干部'); bribeBtn.textContent = '💰 收买干部(资金)'; return; }
          const mid = await showSelect(`选择收买目标（可用资金：${pf.funds}笔）`, members);
          if (!mid) { bribeBtn.textContent = '💰 收买干部(资金)'; return; }
          const { tryBribeMember } = await import('../../logic/loyalty.js');
          const r = tryBribeMember(playerId, factionId, mid);
          await showAlert(r.message);
          refresh();
        } catch(err) {
          await showAlert('收买出错: ' + err.message);
          bribeBtn.textContent = '💰 收买干部(资金)';
        }
      };
    } else {
      showAlert('DEBUG: bribe button not found in DOM');
    }
  });
}

// === APPOINTMENT ===
let _appointScrollTop = 0;
export function resetAppointScroll() { _appointScrollTop = 0; }

function countFactionInPosition(faction, deptId, positionTitle) {
  return faction.members.filter(m => m.dept === deptId && m.position === positionTitle).length;
}

function getVacantPositions(faction) {
  const controlledDepts = new Set(faction.members.map(m => m.dept));
  const result = [];
  for (const [deptId, dept] of Object.entries(DEPARTMENTS)) {
    const isControlled = controlledDepts.has(deptId);
    for (const pos of dept.positions) {
      if (pos.rank === '副部' || pos.rank === '正部') continue;
      const filled = countFactionInPosition(faction, deptId, pos.title);
      const vacant = Math.max(0, pos.count - filled);
      if (vacant > 0) {
        result.push({ deptId, deptName: dept.name, title: pos.title, rank: pos.rank, total: pos.count, filled, vacant, isControlled });
      }
    }
  }
  return result;
}

export function showAppointmentUI(factionId) {
  return new Promise(async (resolve) => {
    const faction = gameState.factions[factionId];
    const positions = getVacantPositions(faction);

    const byDept = {};
    for (const p of positions) {
      if (!byDept[p.deptId]) byDept[p.deptId] = { deptName: p.deptName, positions: [] };
      byDept[p.deptId].positions.push(p);
    }

    const deptIds = Object.keys(byDept);

    let html = '<div class="appointment-panel">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><h4>📋 可任命职位表</h4><button class="modal-btn modal-cancel btn-close-top">✕ 关闭</button></div>';
    html += '<p style="font-size:0.75em;color:var(--text-secondary);margin-bottom:8px;">点击职位查看候选人 | 所有任命均消耗影响力+组织部或本部门资源</p>';

    if (!deptIds.length) {
      html += '<div style="padding:16px;text-align:center;color:var(--text-secondary);">暂无空缺职位</div>';
    } else {
      const sortedDeptIds = deptIds.sort((a, b) => {
        const aCtrl = byDept[a].positions[0]?.isControlled ? 0 : 1;
        const bCtrl = byDept[b].positions[0]?.isControlled ? 0 : 1;
        return aCtrl - bCtrl;
      });
      for (const deptId of sortedDeptIds) {
        const g = byDept[deptId];
        const isControlled = g.positions[0]?.isControlled;
        let ctrlLabel;
        if (isControlled) {
          const deptMembers = faction.members.filter(m => m.dept === deptId);
          const memberNames = deptMembers.map(m => `<span class="dept-member-chip"><span class="avatar-sq av-sm av-dept-${m.dept}">${m.name[0]}</span>${m.name}·${m.position}</span>`).join('');
          ctrlLabel = `🔵 ${memberNames}`;
        } else {
          ctrlLabel = `⚪ 未渗透 · 仅可外部招募`;
        }
        html += `<div class="appoint-dept"><div class="dept-header"><span class="dept-name">${g.deptName}</span><span class="dept-count">${ctrlLabel}</span></div>`;
        for (const p of g.positions) {
          const infCost = PROMOTION_INFLUENCE_COST[p.rank] || '—';
          const resCost = APPOINTMENT_COST[p.rank] || '—';
          const ctrlClass = p.isControlled ? '' : ' pos-noncontrolled';
          html += `<button class="btn-position-pick${ctrlClass}" data-dept="${p.deptId}" data-rank="${p.rank}" data-title="${p.title}" data-controlled="${p.isControlled ? '1' : '0'}">
            <span class="pos-title">${p.title}</span><span class="pos-rank">${p.rank}</span><span class="pos-vacant">缺${p.vacant}/${p.total}</span><span class="pos-cost">💰${infCost}影响+${resCost}资源</span>
          </button>`;
        }
        html += '</div>';
      }
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box modal-appoint">${html}</div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-appoint').scrollTop = _appointScrollTop;

    overlay.querySelectorAll('.modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => {
        _appointScrollTop = overlay.querySelector('.modal-appoint').scrollTop;
        overlay.remove(); resolve(null);
      });
    });

    const posButtons = overlay.querySelectorAll('.btn-position-pick');
    posButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        _appointScrollTop = overlay.querySelector('.modal-appoint').scrollTop;
        const dept = btn.dataset.dept, rank = btn.dataset.rank, title = btn.dataset.title, isControlled = btn.dataset.controlled === '1';
        overlay.remove();
        const result = await showCandidateUI(factionId, dept, rank, title, isControlled);
        resolve(result);
      });
    });
  });
}

function showCandidateUI(factionId, deptId, targetRank, targetTitle, isControlled = true) {
  return new Promise(resolve => {
    const faction = gameState.factions[factionId];
    const dept = DEPARTMENTS[deptId];
    const deptName = dept ? dept.name : deptId;
    const posTitle = targetTitle || `${targetRank}`;

    const rankOrder = ['副处', '正处', '副厅', '正厅'];
    const targetIdx = rankOrder.indexOf(targetRank);
    const sourceRank = targetIdx > 0 ? rankOrder[targetIdx - 1] : targetRank;

    const infCost = PROMOTION_INFLUENCE_COST[targetRank] || 10;
    const resCost = APPOINTMENT_COST[targetRank] || 8;

    let html = '<div class="appointment-panel">';
    html += `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><h4>📋 任命：${deptName} · ${targetRank}（${posTitle}）</h4><button class="modal-btn modal-cancel btn-close-top">✕ 关闭</button></div>`;
    html += `<p style="font-size:0.75em;color:var(--text-secondary);margin-bottom:8px;">消耗 💰${infCost}影响力 + ${resCost}组织部或本部门资源</p>`;

    let hasAny = false;

    if (isControlled && targetIdx > 0) {
      const internalCandidates = faction.members.filter(m => m.dept === deptId && m.rank === sourceRank);
      html += '<div class="appoint-section"><h5>🔵 内部提拔 — 本派系' + sourceRank + '级成员</h5>';
      if (internalCandidates.length) {
        hasAny = true;
        for (const m of internalCandidates) {
          html += `<div class="candidate-row">
            <span class="candidate-info"><span class="avatar-sq av-sm av-dept-${m.dept}">${m.name[0]}</span>${m.name} · ${m.position || m.rank} · 忠${m.loyalty}/9</span>
            <span class="candidate-path">${sourceRank}→${targetRank}</span>
            <button class="btn-small btn-promote" data-mid="${m.id}">提拔</button></div>`;
        }
      } else {
        html += '<div class="candidate-empty">本派系在该部门无' + sourceRank + '级成员可提拔</div>';
      }
      html += '</div>';
    }

    const pool = gameState.independentOfficials || [];
    const externalCandidates = pool.filter(o => o.dept === deptId && o.rank === sourceRank);
    html += '<div class="appoint-section"><h5>🟢 外部招募 — 无派系' + sourceRank + '级干部（加入后获"曾受你的提拔"特性）</h5>';
    if (externalCandidates.length) {
      hasAny = true;
      for (const o of externalCandidates) {
        html += `<div class="candidate-row">
          <span class="candidate-info"><span class="avatar-sq av-sm av-dept-${o.dept}">${o.name[0]}</span>${o.name} · ${o.position || o.rank} · ${o.dept ? (DEPT_NAMES[o.dept] || o.dept) : ''}</span>
          <span class="candidate-path">招募→${targetRank}</span>
          <button class="btn-small btn-recruit" data-name="${o.name}" data-dept="${o.dept}" data-rank="${o.rank}" data-target="${targetRank}" data-target-title="${posTitle}">招募</button></div>`;
      }
    } else {
      html += '<div class="candidate-empty">暂无可招募的' + sourceRank + '级无派系干部</div>';
    }
    html += '</div>';

    if (!hasAny) html += '<div style="padding:12px;text-align:center;color:var(--text-secondary);">暂无可用的候选人</div>';

    html += `<button class="modal-btn" style="margin-top:12px;width:100%;" id="btn-back-to-positions">↩️ 返回职位列表</button></div>`;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box modal-appoint">${html}</div>`;
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.modal-cancel').forEach(btn => {
      btn.addEventListener('click', () => { overlay.remove(); resolve(null); });
    });
    overlay.querySelector('#btn-back-to-positions')?.addEventListener('click', () => {
      overlay.remove();
      showAppointmentUI(factionId).then(resolve);
    });

    overlay.querySelectorAll('.btn-promote').forEach(btn => {
      btn.addEventListener('click', () => { overlay.remove(); resolve({ action: 'promote', memberId: btn.dataset.mid }); });
    });

    overlay.querySelectorAll('.btn-recruit').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.remove();
        resolve({ action: 'recruit', officialName: btn.dataset.name, officialDept: btn.dataset.dept, officialRank: btn.dataset.rank, targetRank: btn.dataset.target, targetTitle: btn.dataset.targetTitle });
      });
    });
  });
}
