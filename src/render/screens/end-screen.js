// src/render/screens/end-screen.js
import { gameState } from '../../logic/state.js';
import { showTitleScreen } from './title-screen.js';

export function showEndScreen(playerWon, data = {}) {
  const root = document.getElementById('app-root');
  const pf = gameState.factions[gameState.playerFactionId];
  const verdict = playerWon ? '🏆 当选省长' : '💔 竞选失败';
  const narrative = playerWon
    ? `省人大会议厅的计票屏幕上，你的名字后面跳出了「${pf.lockedSeats}票」。你望向台下那些曾经与你博弈的对手——有人低头不语，有人挤出笑容点头致意。省委书记的办公室，钥匙已在你手中。`
    : (data.reason === 'collapse' ? '最后一个副厅级干部被带走的那天，你的办公室里安静得可怕。在这张棋盘上，棋子没了，棋手也就出局了。' : '宦海沉浮，你终究是差了一步。');

  let bars = '';
  for (const [fid, f] of Object.entries(gameState.factions)) {
    const pct = (f.lockedSeats / 27) * 100;
    const isPlayer = fid === gameState.playerFactionId;
    bars += `<div class="seat-bar-row ${isPlayer ? 'player' : ''}">
      <span>${f.leaderName}</span><div class="seat-bar-track"><div class="seat-bar-fill" style="width:${pct}%"></div></div><span>${f.lockedSeats}席</span></div>`;
  }

  root.innerHTML = `<div class="end-screen"><div class="end-content">
    <div class="end-verdict ${playerWon ? 'victory' : 'defeat'}">${verdict}</div>
    <div class="end-narrative">${narrative}</div>
    <div class="end-stats"><h3>最终席位分布</h3>${bars}</div>
    <div class="end-summary">📊 第${gameState.turn}轮 | 🔒 你的席位: ${pf.lockedSeats} | 👥 剩余干部: ${pf.members.filter(m => m.investigationStatus !== 'evidence').length}人</div>
    <button class="btn-restart" id="btn-restart">🔄 再来一局</button>
  </div></div>`;
  root.querySelector('#btn-restart').addEventListener('click', showTitleScreen);
}
