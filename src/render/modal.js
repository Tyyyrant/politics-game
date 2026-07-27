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
import { SEAT_TASK_NAMES_CN, DEPT_NAMES } from '../logic/data/constants.js';

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

// Appointment interface
export function showAppointmentUI(factionId) {
  return new Promise(resolve => {
    const faction = gameState.factions[factionId];
    const memberDepts = [...new Set(faction.members.map(m => m.dept))];
    let html = '<div class="appointment-panel"><h4>🏛️ 干部任用</h4>';
    html += '<p style="font-size:0.8em;color:var(--text-secondary);margin-bottom:8px;">消耗组织部资源或本部门资源 | 副处5 · 正处8 · 副厅15</p>';
    html += '<div class="appoint-section"><h5>📋 你控制的部门（可任用新人）</h5>';
    for (const deptId of memberDepts) {
      const deptName = DEPT_NAMES[deptId] || deptId;
      const count = faction.members.filter(m => m.dept === deptId).length;
      html += `<div class="appoint-dept"><span class="dept-name">${deptName}</span><span class="dept-count">${count}人</span>
        <button class="btn-small btn-appoint-new" data-dept="${deptId}" data-rank="副处">+副处(5)</button>
        <button class="btn-small btn-appoint-new" data-dept="${deptId}" data-rank="正处">+正处(8)</button>
        <button class="btn-small btn-appoint-new" data-dept="${deptId}" data-rank="副厅">+副厅(15)</button></div>`;
    }
    html += '</div><div class="appoint-section"><h5>⬆️ 可提拔的现有成员</h5>';
    const promotable = faction.members.filter(m => ['副处', '正处', '副厅'].includes(m.rank));
    if (promotable.length) {
      for (const m of promotable) {
        const next = { '副处': '正处', '正处': '副厅', '副厅': '正厅' }[m.rank];
        const cost = { '副处': 8, '正处': 15 }[m.rank] || '—';
        html += `<div class="appoint-member"><span>${m.name} · ${m.rank}→${next}</span>
          <button class="btn-small btn-promote" data-mid="${m.id}" data-rank="${next}">提拔(${cost})</button></div>`;
      }
    } else { html += '<div style="font-size:0.8em;color:var(--text-secondary);">无</div>'; }
    html += '</div><button class="modal-btn modal-cancel" style="margin-top:12px;">关闭</button></div>';
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `<div class="modal-box modal-appoint">${html}</div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('.modal-cancel').addEventListener('click', () => { overlay.remove(); resolve(null); });
    overlay.querySelectorAll('.btn-appoint-new').forEach(btn => {
      btn.addEventListener('click', () => { overlay.remove(); resolve({ action: 'appoint', dept: btn.dataset.dept, rank: btn.dataset.rank }); });
    });
    overlay.querySelectorAll('.btn-promote').forEach(btn => {
      btn.addEventListener('click', () => { overlay.remove(); resolve({ action: 'promote', memberId: btn.dataset.mid, rank: btn.dataset.rank }); });
    });
  });
}
