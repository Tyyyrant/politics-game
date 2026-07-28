// src/logic/turn.js
import { gameState, emit } from './state.js';
import { FACTION_IDS } from './data/constants.js';
import { produceResources } from './resources.js';
import { checkVictory } from './victory.js';

export function rollDice(sides = 6) { return Math.floor(Math.random() * sides) + 1; }

export function determineTurnOrder() {
  const playerId = gameState.playerFactionId;
  const rolls = FACTION_IDS.map(fid => ({
    factionId: fid, roll: rollDice(), rank: gameState.factions[fid].leaderRank
  }));
  const congress = rolls.find(r => r.factionId === 'npcCongress');
  const cppcc = rolls.find(r => r.factionId === 'npcCppcc');
  const others = rolls.filter(r => r.factionId !== 'npcCongress' && r.factionId !== 'npcCppcc');
  others.sort((a, b) => {
    if (b.roll !== a.roll) return b.roll - a.roll;
    const rankOrder = { '副部': 5, '正厅': 4 };
    return (rankOrder[b.rank] || 0) - (rankOrder[a.rank] || 0);
  });
  // Player always goes first
  const playerEntry = others.find(r => r.factionId === playerId);
  const othersWithoutPlayer = others.filter(r => r.factionId !== playerId);
  gameState.turnOrder = [playerId, ...othersWithoutPlayer.map(r => r.factionId), 'npcCongress', 'npcCppcc'];
  gameState.currentPlayerIndex = 0;
  gameState.phase = 'action';
  gameState.roundLog.push({ factionId: 'system', action: 'roundStart', target: `第${gameState.turn}轮`, result: '开始' });
  emit('turn:order-determined', { order: gameState.turnOrder, rolls });
}

export function isCurrentPlayerAI() {
  const fid = currentFactionId();
  return fid !== gameState.playerFactionId;
}

export function startNewRound() {
  gameState.turn++;
  gameState.phase = 'dice';
  for (const fid of FACTION_IDS) {
    gameState.factions[fid].projectBidUsed = false;
    gameState.factions[fid].raidUsed = false;
    gameState.factions[fid].interrogateUsed = 0;
    gameState.factions[fid].projectVetoUsed = false;
    gameState.factions[fid].visitsThisTurn = 0;
    if (gameState.factions[fid].fiveYearPlanCooldown > 0) gameState.factions[fid].fiveYearPlanCooldown--;
  }
  // Produce resources for everyone at round start
  for (const fid of FACTION_IDS) {
    produceResources(fid);
  }
  emit('turn:new-round', { turn: gameState.turn });
}

export function nextPlayer() {
  gameState.currentPlayerIndex++;
  if (gameState.currentPlayerIndex >= gameState.turnOrder.length) {
    gameState.phase = 'bill';
    emit('turn:all-players-done');
    return false;
  }
  emit('turn:next-player', { factionId: currentFactionId() });
  return true;
}

export function currentFactionId() { return gameState.turnOrder[gameState.currentPlayerIndex]; }

export function enterCleanup() {
  gameState.phase = 'cleanup';
  for (const seat of gameState.npcSeats) {
    if (seat.visitorId && !seat.lockedById) {
      seat.roundsRemaining--;
      if (seat.roundsRemaining <= 0) {
        emit('seat:expired', { seatId: seat.id, visitorId: seat.visitorId });
        seat.visitorId = null;
        seat.roundsRemaining = 2;
      }
    }
  }
  gameState.activeBillEffects = gameState.activeBillEffects.filter(e => {
    const keep = e.duration > 0;
    if (keep) e.duration--;
    return keep;
  });
  if (gameState.turn % 2 === 0) gameState.globalDisciplineMarkPool++;
  checkVictory();
  emit('turn:cleanup-done');
}
