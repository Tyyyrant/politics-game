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

// Seat matrix — show all 27 seats as a clickable grid
// Appointment interface
import { gameState } from '../logic/state.js';
import { DEPARTMENTS } from '../logic/data/departments.js';
import { SEAT_TASK_NAMES_CN, DEPT_NAMES, PROMOTION_INFLUENCE_COST, RECRUIT_INFLUENCE_COST, RECRUIT_RESOURCE_COST, APPOINTMENT_COST } from '../logic/data/constants.js';

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

// Helper: count how many faction members hold a specific position title
function countFactionInPosition(faction, deptId, positionTitle) {
  return faction.members.filter(m => m.dept === deptId && m.position === positionTitle).length;
}

// Helper: get vacant positions for a faction across all departments
function getVacantPositions(faction) {
  const controlledDepts = new Set(faction.members.map(m => m.dept));
  const result = [];
  for (const [deptId, dept] of Object.entries(DEPARTMENTS)) {
    const isControlled = controlledDepts.has(deptId);
    for (const pos of dept.positions) {
      if (pos.rank === '副部' || pos.rank === '正部') continue; // 不可任命副部及以上
      const filled = countFactionInPosition(faction, deptId, pos.title);
      const vacant = Math.max(0, pos.count - filled);
      if (vacant > 0) {
        result.push({
          deptId,
          deptName: dept.name,
          title: pos.title,
          rank: pos.rank,
          total: pos.count,
          filled,
          vacant,
          isControlled  // 是否已有成员在该部门
        });
      }
    }
  }
  return result;
}

// Step 1: Show position table — all vacant positions the faction can fill
export function showAppointmentUI(factionId) {
  return new Promise(async (resolve) => {
    const faction = gameState.factions[factionId];
    const positions = getVacantPositions(faction);

    // Group by department
    const byDept = {};
    for (const p of positions) {
      if (!byDept[p.deptId]) byDept[p.deptId] = { deptName: p.deptName, positions: [] };
      byDept[p.deptId].positions.push(p);
    }

    const deptIds = Object.keys(byDept);

    let html = '<div class="appointment-panel"><h4>📋 可任命职位表</h4>';
    html += '<p style="font-size:0.75em;color:var(--text-secondary);margin-bottom:8px;">点击职位查看候选人 | 所有任命均消耗影响力+组织部或本部门资源</p>';

    if (!deptIds.length) {
      html += '<div style="padding:16px;text-align:center;color:var(--text-secondary);">暂无空缺职位</div>';
    } else {
      // Show controlled departments first, then others
      const sortedDeptIds = deptIds.sort((a, b) => {
        const aCtrl = byDept[a].positions[0]?.isControlled ? 0 : 1;
        const bCtrl = byDept[b].positions[0]?.isControlled ? 0 : 1;
        return aCtrl - bCtrl;
      });
      for (const deptId of sortedDeptIds) {
        const g = byDept[deptId];
        const isControlled = g.positions[0]?.isControlled;
        const memberCount = faction.members.filter(m => m.dept === deptId).length;
        const ctrlLabel = isControlled ? `🔵 本派系${memberCount}人` : `⚪ 未渗透 · 仅可外部招募`;
        html += `<div class="appoint-dept"><div class="dept-header"><span class="dept-name">${g.deptName}</span><span class="dept-count">${ctrlLabel}</span></div>`;
        for (const p of g.positions) {
          const infCost = PROMOTION_INFLUENCE_COST[p.rank] || '—';
          const resCost = APPOINTMENT_COST[p.rank] || '—';
          const ctrlClass = p.isControlled ? '' : ' pos-noncontrolled';
          html += `<button class="btn-position-pick${ctrlClass}" data-dept="${p.deptId}" data-rank="${p.rank}" data-title="${p.title}" data-controlled="${p.isControlled ? '1' : '0'}">
            <span class="pos-title">${p.title}</span>
            <span class="pos-rank">${p.rank}</span>
            <span class="pos-vacant">缺${p.vacant}/${p.total}</span>
            <span class="pos-cost">💰${infCost}影响+${resCost}资源</span>
          </button>`;
        }
        html += '</div>';
      }
    }

    html += '<button class="modal-btn modal-cancel" style="margin-top:12px;width:100%;">关闭</button></div>';

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box modal-appoint">${html}</div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('.modal-cancel').addEventListener('click', () => {
      overlay.remove();
      resolve(null);
    });

    // Click a position → show candidate list
    const posButtons = overlay.querySelectorAll('.btn-position-pick');
    posButtons.forEach(btn => {
      btn.addEventListener('click', async () => {
        const dept = btn.dataset.dept;
        const rank = btn.dataset.rank;
        const title = btn.dataset.title;
        const isControlled = btn.dataset.controlled === '1';
        overlay.remove();
        // Show step 2: candidate list
        const result = await showCandidateUI(factionId, dept, rank, title, isControlled);
        resolve(result);
      });
    });
  });
}

// Step 2: Show candidates for a specific position
function showCandidateUI(factionId, deptId, targetRank, targetTitle, isControlled = true) {
  return new Promise(resolve => {
    const faction = gameState.factions[factionId];
    const dept = DEPARTMENTS[deptId];
    const deptName = dept ? dept.name : deptId;
    const posTitle = targetTitle || `${targetRank}`;

    const rankOrder = ['副处', '正处', '副厅', '正厅'];
    const targetIdx = rankOrder.indexOf(targetRank);
    const sourceRank = targetIdx > 0 ? rankOrder[targetIdx - 1] : targetRank; // one rank below; for 副处, use same rank

    const infCost = PROMOTION_INFLUENCE_COST[targetRank] || 10;
    const resCost = APPOINTMENT_COST[targetRank] || 8;

    let html = '<div class="appointment-panel"><h4>📋 任命：' + deptName + ' · ' + targetRank + '（' + posTitle + '）</h4>';
    html += `<p style="font-size:0.75em;color:var(--text-secondary);margin-bottom:8px;">消耗 💰${infCost}影响力 + ${resCost}组织部或本部门资源</p>`;

    let hasAny = false;

    // === Section 1: Internal promotion (only for controlled departments) ===
    if (isControlled && targetIdx > 0) {
      const internalCandidates = faction.members.filter(m =>
        m.dept === deptId && m.rank === sourceRank
      );
      html += '<div class="appoint-section"><h5>🔵 内部提拔 — 本派系' + sourceRank + '级成员</h5>';
      if (internalCandidates.length) {
        hasAny = true;
        for (const m of internalCandidates) {
          html += `<div class="candidate-row">
            <span class="candidate-info">${m.name} · ${m.position || m.rank} · 忠${m.loyalty}/9</span>
            <span class="candidate-path">${sourceRank}→${targetRank}</span>
            <button class="btn-small btn-promote" data-mid="${m.id}">提拔</button>
          </div>`;
        }
      } else {
        html += '<div class="candidate-empty">本派系在该部门无' + sourceRank + '级成员可提拔</div>';
      }
      html += '</div>';
    }

    // === Section 2: External recruitment ===
    const pool = gameState.independentOfficials || [];
    // For recruitment, look for officials at sourceRank (one below target, or same for 副处)
    const externalCandidates = pool.filter(o => o.dept === deptId && o.rank === sourceRank);
    html += '<div class="appoint-section"><h5>🟢 外部招募 — 无派系' + sourceRank + '级干部（加入后获"曾受你的提拔"特性）</h5>';
    if (externalCandidates.length) {
      hasAny = true;
      const recInfCost = RECRUIT_INFLUENCE_COST[targetRank] || infCost;
      const recResCost = RECRUIT_RESOURCE_COST[targetRank] || resCost;
      for (const o of externalCandidates) {
        html += `<div class="candidate-row">
          <span class="candidate-info">${o.name} · ${o.position || o.rank} · ${o.dept ? (DEPT_NAMES[o.dept] || o.dept) : ''}</span>
          <span class="candidate-path">招募→${targetRank}</span>
          <button class="btn-small btn-recruit" data-name="${o.name}" data-dept="${o.dept}" data-rank="${o.rank}" data-target="${targetRank}" data-target-title="${posTitle}">招募</button>
        </div>`;
      }
    } else {
      html += '<div class="candidate-empty">暂无可招募的' + (sourceRank || targetRank) + '级无派系干部</div>';
    }
    html += '</div>';

    if (!hasAny) html += '<div style="padding:12px;text-align:center;color:var(--text-secondary);">暂无可用的候选人</div>';

    html += `<button class="modal-btn modal-cancel" style="margin-top:12px;width:100%;">返回职位列表</button></div>`;

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box modal-appoint">${html}</div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('.modal-cancel').addEventListener('click', () => {
      overlay.remove();
      // Go back to position table
      showAppointmentUI(factionId).then(resolve);
    });

    overlay.querySelectorAll('.btn-promote').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.remove();
        resolve({ action: 'promote', memberId: btn.dataset.mid });
      });
    });

    overlay.querySelectorAll('.btn-recruit').forEach(btn => {
      btn.addEventListener('click', () => {
        overlay.remove();
        resolve({ action: 'recruit', officialName: btn.dataset.name, officialDept: btn.dataset.dept, officialRank: btn.dataset.rank, targetRank: btn.dataset.target, targetTitle: btn.dataset.targetTitle });
      });
    });
  });
}
