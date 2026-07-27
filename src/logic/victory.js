// src/logic/victory.js
import { gameState, emit } from './state.js';
import { TOTAL_NPC_SEATS, MAX_ROUNDS, EXTENSION_ROUNDS } from './data/constants.js';

export function checkVictory() {
  const playerId = gameState.playerFactionId;
  const pf = gameState.factions[playerId];
  const majority = Math.floor(TOTAL_NPC_SEATS / 2) + 1;

  const senior = pf.members.filter(m => (m.rank === '副厅' || m.rank === '正厅') && m.investigationStatus !== 'evidence');
  if (senior.length === 0 && gameState.turn > 1) {
    gameState.phase = 'gameOver';
    emit('victory:early-defeat', { reason: 'collapse', message: '所有副厅以上干部被查处，派系崩溃' });
    return { gameOver: true, playerLost: true, reason: 'collapse' };
  }

  const disloyal = pf.members.filter(m => m.loyalty <= 2).length;
  if (disloyal > pf.members.length / 2 && pf.members.length > 0) {
    gameState.phase = 'gameOver';
    emit('victory:early-defeat', { reason: 'disloyalty', message: '半数以上成员忠诚度崩溃' });
    return { gameOver: true, playerLost: true, reason: 'disloyalty' };
  }

  if (gameState.turn >= MAX_ROUNDS) {
    if (pf.lockedSeats >= majority) {
      gameState.phase = 'gameOver';
      emit('victory:win', { type: 'majority', seats: pf.lockedSeats });
      return { gameOver: true, playerWon: true, type: 'majority' };
    }
    if (gameState.turn < MAX_ROUNDS + EXTENSION_ROUNDS) {
      if (pf.lockedSeats >= 12) {
        gameState.phase = 'gameOver';
        emit('victory:win', { type: 'extension', seats: pf.lockedSeats });
        return { gameOver: true, playerWon: true, type: 'extension' };
      }
    }
    if (gameState.turn >= MAX_ROUNDS + EXTENSION_ROUNDS) {
      let maxSeats = 0, winner = null;
      for (const [fid, f] of Object.entries(gameState.factions)) {
        if (f.lockedSeats > maxSeats) { maxSeats = f.lockedSeats; winner = fid; }
      }
      gameState.phase = 'gameOver';
      if (winner === playerId) {
        emit('victory:win', { type: 'plurality', seats: maxSeats });
        return { gameOver: true, playerWon: true, type: 'plurality' };
      }
      emit('victory:lose', { type: 'plurality', playerSeats: pf.lockedSeats, winnerSeats: maxSeats });
      return { gameOver: true, playerLost: true, type: 'plurality' };
    }
  }
  return { gameOver: false };
}
