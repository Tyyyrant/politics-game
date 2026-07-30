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

  // 玩家席位多时AI更激进
  const playerSeats = gameState.factions[gameState.playerFactionId].lockedSeats || 0;
  const emergencyMode = playerSeats > 10;  // 玩家>10席，AI不惜代价抢

  // 第一轮不打探不抢夺
  if (gameState.turn > 1) {
    const occupiedByOther = gameState.npcSeats.filter(s => s.visitorId && s.visitorId !== factionId && !s.lockedById);
    // 优先打探玩家的席位
    const playerOccupied = occupiedByOther.filter(s => s.visitorId === gameState.playerFactionId);
    const otherOccupied = occupiedByOther.filter(s => s.visitorId !== gameState.playerFactionId);

    // 打探
    const scoutTargets = emergencyMode ? [...playerOccupied, ...otherOccupied] : [...playerOccupied, ...otherOccupied].sort(() => Math.random() - 0.5);
    const unscoutedTargets = scoutTargets.filter(s => !s.scoutedBy?.includes(factionId));
    if (unscoutedTargets.length && faction.influence >= 1) {
      const target = unscoutedTargets[0]; // 优先第一个（玩家席位在前）
      const priority = target.visitorId === gameState.playerFactionId ? 5 : 2;
      candidates.push({ type: ACTION_TYPES.SCOUT_SEAT, params: { seatId: target.id }, score: 4 + p.aggression * priority });
    }

    // 抢夺已打探过的席位（优先玩家）
    const scoutedOccupied = occupiedByOther.filter(s => s.scoutedBy?.includes(factionId));
    if (scoutedOccupied.length && faction.influence >= 2) {
      const playerScouted = scoutedOccupied.filter(s => s.visitorId === gameState.playerFactionId);
      const otherScouted = scoutedOccupied.filter(s => s.visitorId !== gameState.playerFactionId);
      const stealPool = emergencyMode ? [...playerScouted, ...otherScouted] : [...playerScouted, ...otherScouted].sort(() => Math.random() - 0.5);
      if (stealPool.length && (p.aggression > 0.3 || emergencyMode)) {
        const target = stealPool[0];
        const stealScore = (target.visitorId === gameState.playerFactionId ? 8 : 3) * (emergencyMode ? 2 : 1);
        candidates.push({ type: ACTION_TYPES.STEAL_SEAT, params: { seatId: target.id }, score: stealScore * p.aggression });
      }
    }
  }

  // 查处玩家干部（紧急模式更激进）
  const investThreshold = emergencyMode ? 0.1 : 0.4;
  if (faction.disciplineMarks >= 1 && p.aggression > investThreshold) {
    const pm = gameState.factions[gameState.playerFactionId].members.filter(m => !m.isUnderInvestigation && m.rank !== '副部');
    if (pm.length) {
      const t = pm[Math.floor(Math.random() * pm.length)];
      const investScore = p.aggression * (sit.threatMap[gameState.playerFactionId] || 0.5) * (emergencyMode ? 20 : 12);
      candidates.push({ type: ACTION_TYPES.INVESTIGATE, params: { targetFactionId: gameState.playerFactionId, memberId: t.id }, score: investScore });
    }
  }

  // 审讯（紧急模式更激进）
  const interrogateThreshold = emergencyMode ? 0.2 : 0.6;
  if ((faction.resources.publicSecurity || 0) >= 2 && p.aggression > interrogateThreshold) {
    const interScore = p.aggression * (sit.threatMap[gameState.playerFactionId] || 0.5) * (emergencyMode ? 18 : 10);
    candidates.push({ type: 'interrogate', params: { targetFactionId: gameState.playerFactionId }, score: interScore });
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
