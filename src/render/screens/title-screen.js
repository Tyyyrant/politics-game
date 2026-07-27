// src/render/screens/title-screen.js
import { createNewGame } from '../../logic/state.js';
import { FACTION_DEFS, createInitialFactionState, getFactionResources, getFactionInfluence } from '../../logic/data/factions.js';
import { showGameScreen } from './game-screen.js';
import { listSaves, loadGame } from '../../logic/save.js';
import { DEPARTMENTS } from '../../logic/data/departments.js';
import { DEPT_NAMES, TRAITS } from '../../logic/data/constants.js';

export async function showTitleScreen() {
  const root = document.getElementById('app-root');
  root.innerHTML = `
    <div class="title-screen">
      <div class="title-content">
        <h1 class="title-main">政治模拟</h1>
        <h2 class="title-sub">派系斗争</h2>
        <p class="title-desc">省级官场政治博弈 · 回合制策略游戏</p>
        <div class="title-choose-label">选择你的派系</div>
        <div class="faction-select-grid" id="faction-grid"></div>
        <div class="title-saves" id="title-saves"></div>
      </div>
    </div>`;

  const grid = root.querySelector('#faction-grid');
  for (const [fid, def] of Object.entries(FACTION_DEFS)) {
    if (!def.leader.isPlayerControllable) continue;
    const card = document.createElement('div');
    card.className = 'faction-select-card';
    card.innerHTML = `<div class="faction-card-header">${def.leader.title}</div>
      <div class="faction-card-leader">首领：${def.leader.name}</div>
      <div class="faction-card-stats">👥 ${def.members.length}名干部 · ${def.leader.rank}级</div>
      <div class="faction-card-desc">${getDesc(fid)}</div>`;
    card.addEventListener('click', () => { showFactionPreview(fid); });
    grid.appendChild(card);
  }

  // 存档列表
  const savesDiv = root.querySelector('#title-saves');
  try {
    const saves = await listSaves();
    if (saves.length) {
      savesDiv.innerHTML = '<h3>继续游戏</h3>' + saves.map(s =>
        `<button class="btn-save-load" data-slot="${s.slot}">📁 ${s.meta?.playerFaction || '?'} · 第${s.meta?.turn || '?'}轮</button>`
      ).join('');
      savesDiv.querySelectorAll('.btn-save-load').forEach(btn => {
        btn.addEventListener('click', async () => {
          await loadGame(btn.dataset.slot);
          showGameScreen();
        });
      });
    }
  } catch (e) { /* no saves */ }
}

function getDesc(fid) {
  const m = {
    propaganda: '宣传核心+纪委眼线。擅长舆论引导。',
    discipline: '纪委+政法委双线执法。查处之王。',
    organization: '门生故吏遍天下。干部任用专家。',
    publicSecurity: '政法铁三角。审讯突击，暴力压制。'
  };
  return m[fid] || '';
}

function showFactionPreview(fid) {
  const def = FACTION_DEFS[fid];
  const state = createInitialFactionState(fid);
  const resources = getFactionResources(state);
  const influence = getFactionInfluence(state);

  // Controlled departments
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
    showTitleScreen();
  });
}
