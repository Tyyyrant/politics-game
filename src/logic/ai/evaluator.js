// src/logic/ai/evaluator.js
import { gameState } from '../state.js';
import { TOTAL_NPC_SEATS } from '../data/constants.js';

export function evaluateSituation(factionId) {
  const faction = gameState.factions[factionId];
  const playerId = gameState.playerFactionId;
  const majority = Math.floor(TOTAL_NPC_SEATS / 2) + 1;
  const seatGap = majority - faction.lockedSeats;
  let maxSeats = 0, leader = null;
  for (const [fid, f] of Object.entries(gameState.factions)) {
    if (f.lockedSeats > maxSeats) { maxSeats = f.lockedSeats; leader = fid; }
  }
  const leaderGap = maxSeats - faction.lockedSeats;
  const threatMap = {};
  for (const [fid, f] of Object.entries(gameState.factions)) {
    if (fid === factionId) continue;
    let threat = f.lockedSeats * 0.15 + f.disciplineMarks * 0.1;
    threat += f.members.filter(m => m.rank === '副厅' || m.rank === '正厅').length * 0.1;
    if (fid === playerId) threat += 0.2;
    threatMap[fid] = Math.min(1, threat);
  }
  let totalResources = 0;
  for (const v of Object.values(faction.resources)) totalResources += v;
  const resourceHealth = Math.min(1, totalResources / 50);
  const vulnerabilityMap = {
    lowLoyaltyMembers: faction.members.filter(m => m.loyalty <= 5).length,
    underInvestigation: faction.members.filter(m => m.isUnderInvestigation).length,
    noDisciplineDefense: faction.disciplineMarks < 2,
    hasBriberyMarks: faction.briberyMarks.length > 0
  };
  return { seatGap, leaderGap, leader, threatMap, resourceHealth, vulnerabilityMap, maxSeats };
}
