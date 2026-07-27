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

  // 拜访未攻略席位
  const unvisited = gameState.npcSeats.filter(s => !s.visitorId && !s.lockedById);
  if (unvisited.length && faction.influence >= 1) {
    candidates.push({ type: ACTION_TYPES.VISIT_SEAT, params: { seatId: unvisited[0].id }, score: sit.seatGap * (1 - p.aggression) * 10 });
  }

  // 完成已有席位任务（只能完成上回合拜访的，且确实有资源）
  for (const seat of gameState.npcSeats) {
    if (seat.visitorId === factionId && seat.visitedOnTurn !== gameState.turn) {
      const canAfford = seat.task.resourceType === 'any'
        ? Object.values(faction.resources).reduce((s, v) => s + v, 0) >= seat.task.cost
        : (faction.resources[seat.task.resourceType] || 0) >= seat.task.cost;
      if (canAfford) {
        // Higher score when seat gap is large, lower when resources are tight
        const score = 15 + sit.seatGap * 2 + sit.resourceHealth * 5;
        candidates.push({ type: ACTION_TYPES.COMPLETE_TASK, params: { seatId: seat.id }, score });
      }
    }
  }

  // 抢夺对手席位
  for (const seat of gameState.npcSeats) {
    if (seat.visitorId && seat.visitorId !== factionId && !seat.lockedById && faction.influence >= 2) {
      candidates.push({ type: ACTION_TYPES.STEAL_SEAT, params: { seatId: seat.id }, score: sit.seatGap * p.aggression * (sit.threatMap[seat.visitorId] || 0.5) * 15 });
    }
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
