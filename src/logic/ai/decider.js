// src/logic/ai/decider.js
import { gameState } from '../state.js';
import { evaluateSituation } from './evaluator.js';
import { AI_PERSONALITIES } from './personality.js';
import { executeAction } from '../actions.js';
import { ACTION_TYPES } from '../data/constants.js';

export function decideAIActions(factionId) {
  const p = AI_PERSONALITIES[factionId] || { aggression: 0.5, cooperation: 0.5, riskTolerance: 0.5 };
  const sit = evaluateSituation(factionId);
  const faction = gameState.factions[factionId];
  const candidates = [];

  // 拜访未攻略席位（只看空闲席位，不知道谁在攻略）
  const unvisited = gameState.npcSeats.filter(s => !s.visitorId && !s.lockedById);
  if (unvisited.length && faction.influence >= 1) {
    candidates.push({ type: ACTION_TYPES.VISIT_SEAT, params: { seatId: unvisited[0].id }, score: sit.seatGap * (1 - p.aggression) * 10 });
  }

  // 完成自己的席位任务（最多完成2个）
  let completeCount = 0;
  for (const seat of gameState.npcSeats) {
    if (completeCount >= 2) break;
    if (seat.visitorId === factionId && seat.visitedOnTurn !== gameState.turn) {
      const canAfford = seat.task.resourceType === 'any'
        ? Object.values(faction.resources).reduce((s, v) => s + v, 0) >= seat.task.cost
        : (faction.resources[seat.task.resourceType] || 0) >= seat.task.cost;
      if (canAfford && sit.resourceHealth > 0.3) {  // Only complete if resources aren't depleted
        completeCount++;
        const score = 15 + sit.seatGap * 2 + sit.resourceHealth * 5;
        candidates.push({ type: ACTION_TYPES.COMPLETE_TASK, params: { seatId: seat.id }, score });
      }
    }
  }

  // 先打探一个被占用的席位（花1影响力）
  const occupiedByOther = gameState.npcSeats.filter(s => s.visitorId && s.visitorId !== factionId && !s.lockedById);
  const unscoutedOccupied = occupiedByOther.filter(s => !s.scoutedBy?.includes(factionId));
  if (unscoutedOccupied.length && faction.influence >= 1) {
    const target = unscoutedOccupied[Math.floor(Math.random() * unscoutedOccupied.length)];
    candidates.push({ type: ACTION_TYPES.SCOUT_SEAT, params: { seatId: target.id }, score: 4 + p.aggression * 3 });
  }

  // 抢夺已打探过的席位（需要3影响力：1打探+2抢夺，且双倍资源）
  const scoutedOccupied = occupiedByOther.filter(s => s.scoutedBy?.includes(factionId));
  if (scoutedOccupied.length && faction.influence >= 2 && p.aggression > 0.5) {
    const target = scoutedOccupied[Math.floor(Math.random() * scoutedOccupied.length)];
    candidates.push({ type: ACTION_TYPES.STEAL_SEAT, params: { seatId: target.id }, score: sit.seatGap * p.aggression * 5 });
  }

  // 查处玩家干部
  if (faction.disciplineMarks >= 1 && p.aggression > 0.4) {
    const pm = gameState.factions[gameState.playerFactionId].members.filter(m => !m.isUnderInvestigation && m.rank !== '副部');
    if (pm.length) {
      const t = pm[Math.floor(Math.random() * pm.length)];
      candidates.push({ type: ACTION_TYPES.INVESTIGATE, params: { targetFactionId: gameState.playerFactionId, memberId: t.id }, score: p.aggression * (sit.threatMap[gameState.playerFactionId] || 0.5) * 12 });
    }
  }

  // 审讯
  if ((faction.resources.publicSecurity || 0) >= 2 && p.aggression > 0.6) {
    candidates.push({ type: 'interrogate', params: { targetFactionId: gameState.playerFactionId }, score: p.aggression * (sit.threatMap[gameState.playerFactionId] || 0.5) * 10 });
  }

  // 提升忠诚度
  if (sit.vulnerabilityMap.lowLoyaltyMembers > 1) {
    const lm = faction.members.find(m => m.loyalty <= 5);
    if (lm && faction.influence >= 10) {
      candidates.push({ type: ACTION_TYPES.BOOST_LOYALTY_INFLUENCE, params: { memberId: lm.id }, score: (1 - p.riskTolerance) * 8 });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const selected = Math.random() < 0.85 ? candidates.slice(0, 3) : candidates.sort(() => Math.random() - 0.5).slice(0, 3);
  return selected;
}
