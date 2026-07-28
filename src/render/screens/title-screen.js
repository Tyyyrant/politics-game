// src/render/screens/title-screen.js
import { createNewGame } from '../../logic/state.js';
import { FACTION_DEFS, createInitialFactionState, getFactionResources, getFactionInfluence } from '../../logic/data/factions.js';
import { showGameScreen } from './game-screen.js';
import { listSaves, loadGame, deleteSave } from '../../logic/save.js';
import { DEPARTMENTS } from '../../logic/data/departments.js';
import { DEPT_NAMES, TRAITS } from '../../logic/data/constants.js';

// === 主菜单 ===
export async function showTitleScreen() {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="title-screen">
      <div class="title-content">
        <h1 class="title-main">政治模拟</h1>
        <h2 class="title-sub">派系斗争</h2>
        <p class="title-desc">省级官场政治博弈 · 回合制策略游戏</p>
        <div class="title-menu" id="title-menu">
          <button class="btn-menu" id="btn-new-game">🆕 新游戏</button>
          <button class="btn-menu" id="btn-load-save">📂 读取存档</button>
          <button class="btn-menu" id="btn-exit-game">🚪 退出游戏</button>
        </div>
      </div>
    </div>`;

  document.getElementById('btn-new-game').addEventListener('click', () => showFactionSelect());
  document.getElementById('btn-load-save').addEventListener('click', () => showSaveManager());
  document.getElementById('btn-exit-game').addEventListener('click', () => {
    try { window.close(); } catch(e) {}
    try { if (window.saveAPI) window.saveAPI.quit(); } catch(e) {}
  });
}

// === 选择派系（无存档区） ===
function showFactionSelect() {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="title-screen">
      <div class="title-content">
        <h1 class="title-main">政治模拟</h1>
        <h2 class="title-sub">派系斗争</h2>
        <div class="title-choose-label">选择你的派系</div>
        <div class="faction-select-grid" id="faction-grid"></div>
        <button class="btn-menu btn-back" id="btn-back-menu">↩️ 返回主菜单</button>
      </div>
    </div>`;

  const grid = root.querySelector('#faction-grid');
  for (const [fid, def] of Object.entries(FACTION_DEFS)) {
    if (!def.leader.isPlayerControllable) continue;
    const info = getFactionInfo(fid);
    const card = document.createElement('div');
    card.className = `faction-card tw-card ${info.cssClass}`;
    card.innerHTML = `
      <div class="tw-card-bg"></div>
      <div class="tw-portrait">
        <div class="tw-portrait-placeholder">${def.leader.name[0]}</div>
        <div class="tw-portrait-ring"></div>
      </div>
      <div class="tw-card-content">
        <div class="tw-card-title">${def.leader.title}</div>
        <div class="tw-card-name">${def.leader.name}</div>
        <div class="tw-card-traits">
          ${info.traits.map(t => `<span class="tw-trait">${t}</span>`).join('')}
        </div>
        <div class="tw-card-footer">
          <span>👥 ${def.members.length}名干部</span>
          <span>${def.leader.rank}级</span>
        </div>
      </div>`;
    card.addEventListener('click', () => { showFactionPreview(fid); });
    grid.appendChild(card);
  }

  document.getElementById('btn-back-menu').addEventListener('click', () => showTitleScreen());
}

// === 存档管理 ===
async function showSaveManager() {
  const root = document.getElementById('app-root');
  const saves = await listSaves().catch(() => []);

  let savesHtml;
  if (saves.length) {
    savesHtml = saves.map(s => {
      const date = s.timestamp ? new Date(s.timestamp).toLocaleString('zh-CN') : '未知时间';
      return `<div class="save-row">
        <div class="save-info">
          <span class="save-slot">📁 ${s.slot}</span>
          <span class="save-detail">${s.meta?.playerFaction || '?'} · 第${s.meta?.turn || '?'}轮 · ${date}</span>
        </div>
        <div class="save-actions">
          <button class="btn-small btn-load-save" data-slot="${s.slot}">读取</button>
          <button class="btn-small btn-delete-save" data-slot="${s.slot}">🗑️ 删除</button>
        </div>
      </div>`;
    }).join('');
  } else {
    savesHtml = '<div class="empty-hint" style="padding:20px;text-align:center;">暂无存档</div>';
  }

  root.innerHTML = `
    <div class="title-screen">
      <div class="title-content">
        <h1 class="title-main">读取存档</h1>
        <div class="save-list" id="save-list">${savesHtml}</div>
        <button class="btn-menu btn-back" id="btn-back-menu">↩️ 返回主菜单</button>
      </div>
    </div>`;

  document.getElementById('btn-back-menu').addEventListener('click', () => showTitleScreen());

  // Load
  root.querySelectorAll('.btn-load-save').forEach(btn => {
    btn.addEventListener('click', async () => {
      await loadGame(btn.dataset.slot);
      showGameScreen();
    });
  });

  // Delete
  root.querySelectorAll('.btn-delete-save').forEach(btn => {
    btn.addEventListener('click', async () => {
      await deleteSave(btn.dataset.slot);
      showSaveManager();  // Refresh
    });
  });
}

// === 辅助 ===
function getDesc(fid) {
  const m = {
    propaganda: '宣传核心+纪委眼线。擅长舆论引导。',
    discipline: '纪委+政法委双线执法。查处之王。',
    organization: '门生故吏遍天下。干部任用专家。',
    publicSecurity: '政法铁三角。审讯突击，暴力压制。'
  };
  return m[fid] || '';
}

function getFactionInfo(fid) {
  const m = {
    propaganda: { cssClass: 'tw-fac-propaganda', color: '#c8a45c', traits: ['舆论引导', '跨部门网络', '宣传核心'] },
    discipline:   { cssClass: 'tw-fac-discipline', color: '#8a9ba8', traits: ['查处干部', '执法双线', '纪律铁腕'] },
    organization: { cssClass: 'tw-fac-organization', color: '#5a8a9a', traits: ['干部任用', '门生故吏', '组织大师'] },
    publicSecurity: { cssClass: 'tw-fac-security', color: '#6a8a6a', traits: ['公安审讯', '突击检查', '政法铁三角'] }
  };
  return m[fid] || { cssClass: '', color: '#888', traits: [] };
}

// === 派系预览 ===
function showFactionPreview(fid) {
  const def = FACTION_DEFS[fid];
  const state = createInitialFactionState(fid);
  const resources = getFactionResources(state);
  const influence = getFactionInfluence(state);

  const controlledDepts = [...new Set(state.members.map(m => m.dept))];

  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="title-screen">
      <div class="preview-panel">
        <h2>${def.leader.title}</h2>
        <div class="preview-leader">首领：<b>${def.leader.name}</b> · ${def.leader.rank}级</div>
        <div class="preview-desc">${getDesc(fid)}</div>

        <div class="preview-section">
          <h3>👥 派系成员（${state.members.length}人）</h3>
          <table class="preview-table"><thead><tr><th>姓名</th><th>部门</th><th>职务</th><th>级别</th><th>忠诚</th><th>特质</th></tr></thead>
          <tbody>${state.members.map(m => `
            <tr><td>${m.name}</td><td>${DEPT_NAMES[m.dept] || m.dept}</td><td>${m.position}</td><td>${m.rank}</td><td>${m.loyalty}/9</td><td>${m.traits.map(t => TRAITS[t] || t).join('、') || '—'}</td></tr>
          `).join('')}</tbody></table>
        </div>

        <div class="preview-section">
          <h3>📊 初始资源</h3>
          <div class="preview-resources">
            <span>💰 影响力：<b>${influence}</b></span>
            <span>🏛️ 控制部门：<b>${controlledDepts.length}</b>个（${controlledDepts.map(d => DEPT_NAMES[d] || d).join('、')}）</span>
          </div>
          <div class="preview-resource-tags">
            ${Object.entries(resources).map(([d, v]) => `<span class="res-tag">${DEPT_NAMES[d] || d}: ${v}</span>`).join('')}
          </div>
        </div>

        <div class="preview-buttons">
          <button class="btn-preview-start" id="btn-start-game">✅ 开始游戏</button>
          <button class="btn-preview-back" id="btn-back-select">↩️ 返回选择</button>
        </div>
      </div>
    </div>`;

  document.getElementById('btn-start-game').addEventListener('click', () => {
    createNewGame(fid);
    showGameScreen();
  });
  document.getElementById('btn-back-select').addEventListener('click', () => {
    showFactionSelect();
  });
}
