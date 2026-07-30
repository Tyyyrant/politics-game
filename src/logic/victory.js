// src/logic/victory.js
import { gameState, emit } from './state.js';
import { TOTAL_NPC_SEATS, MAX_ROUNDS, MAJORITY_SEATS } from './data/constants.js';

export function checkVictory() {
  const playerId = gameState.playerFactionId;
  const pf = gameState.factions[playerId];

  const result = doCheck(playerId, pf);
  if (result.gameOver) {
    gameState.lastVictory = result;
  }
  return result;
}

function doCheck(playerId, pf) {
  // 提前失败：所有副厅以上干部被查处
  const senior = pf.members.filter(m => (m.rank === '副厅' || m.rank === '正厅') && m.investigationStatus !== 'evidence');
  if (senior.length === 0 && gameState.turn > 1) {
    gameState.phase = 'gameOver';
    return { gameOver: true, playerLost: true, reason: 'collapse', playerWon: false };
  }

  // 提前失败：半数以上成员忠诚崩溃
  const disloyal = pf.members.filter(m => m.loyalty <= 2).length;
  if (disloyal > pf.members.length / 2 && pf.members.length > 0) {
    gameState.phase = 'gameOver';
    return { gameOver: true, playerLost: true, reason: 'disloyalty', playerWon: false };
  }

  // 过半获胜（10轮后才触发）
  if (gameState.turn > 10) {
    const majorityWinner = findMajorityWinner();
    if (majorityWinner) {
      gameState.phase = 'gameOver';
      const won = majorityWinner === playerId;
      return { gameOver: true, playerWon: won, playerLost: !won, type: 'majority', winner: majorityWinner, seats: gameState.factions[playerId].lockedSeats };
    }
  }

  // 第20轮结算
  if (gameState.turn >= MAX_ROUNDS) {
    gameState.phase = 'gameOver';
    let maxSeats = 0, winner = null;
    for (const [fid, f] of Object.entries(gameState.factions)) {
      if (f.lockedSeats > maxSeats) { maxSeats = f.lockedSeats; winner = fid; }
    }
    const won = winner === playerId;
    return { gameOver: true, playerWon: won, playerLost: !won, type: 'final', seats: pf.lockedSeats, maxSeats };
  }

  return { gameOver: false };
}

function findMajorityWinner() {
  for (const [fid, f] of Object.entries(gameState.factions)) {
    if (f.lockedSeats >= MAJORITY_SEATS) return fid;
  }
  return null;
}
