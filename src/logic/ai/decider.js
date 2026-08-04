// src/logic/ai/decider.js
import { gameState } from '../state.js';
import { evaluateSituation } from './evaluator.js';
import { executeAction } from '../actions.js';
import { ACTION_TYPES } from '../data/constants.js';

export function decideAIActions(factionId) {
  const strategy = gameState.aiStrategies[factionId];
  const sit = evaluateSituation(factionId);
  const faction = gameState.factions[factionId];
  const playerSeats = gameState.factions[gameState.playerFactionId].lockedSeats || 0;
  const candidates = [];

  // 判断是否进入攻击模式
  const attackMode = playerSeats > (strategy.rules.attackPlayerThreshold ?? 7);
  const attacker = strategy.rules.attackMultiplier ?? 1.0;

  // === 遍历策略权重，为每项行动生成候选 ===
  for (const [action, baseWeight] of Object.entries(strategy.weights)) {
    if (baseWeight <= 0) continue;
    if (strategy.rules.neverUse?.includes(action)) continue;

    let score = baseWeight * 10;
    let params = {};

    switch (action) {
      case 'visitSeat': {
        const seats = gameState.npcSeats.filter(s => !s.visitorId && !s.lockedById);
        if (!seats.length || faction.influence < 1) continue;
        const pick = seats[Math.floor(Math.random() * seats.length)];
        params = { seatId: pick.id };
        score += sit.seatGap * 5;
        break;
      }

      case 'completeTask': {
        const mySeats = gameState.npcSeats.filter(s =>
          s.visitorId === factionId && s.visitedOnTurn !== gameState.turn);
        if (!mySeats.length) continue;
        // 选能负担得起的
        const affordables = mySeats.filter(s => {
          if (s.task.resourceType === 'any')
            return Object.values(faction.resources).reduce((a,b)=>a+b,0) >= s.task.cost;
          return (faction.resources[s.task.resourceType] || 0) >= s.task.cost;
        });
        if (!affordables.length) continue;
        const pick = affordables[0];
        params = { seatId: pick.id };
        score += sit.seatGap * 3 + sit.resourceHealth * 3;
        if (strategy.rules.completeOwnTasksFirst) score += 20;
        break;
      }

      case 'scoutSeat': {
        if (gameState.turn <= 1) continue;
        const occupied = gameState.npcSeats.filter(s => s.visitorId && s.visitorId !== factionId && !s.lockedById);
        const unscouted = occupied.filter(s => !s.scoutedBy?.includes(factionId));
        if (!unscouted.length || faction.influence < 1) continue;
        // 玩家优先
        const playerTargets = unscouted.filter(s => s.visitorId === gameState.playerFactionId);
        const pick = playerTargets.length ? playerTargets[0] : unscouted[Math.floor(Math.random() * unscouted.length)];
        params = { seatId: pick.id };
        if (pick.visitorId === gameState.playerFactionId) score += 20 * attacker;
        break;
      }

      case 'stealSeat': {
        if (gameState.turn <= 1) continue;
        const occupied = gameState.npcSeats.filter(s => s.visitorId && s.visitorId !== factionId && !s.lockedById);
        const scouted = occupied.filter(s => s.scoutedBy?.includes(factionId));
        if (!scouted.length || faction.influence < 2) continue;
        const playerTargets = scouted.filter(s => s.visitorId === gameState.playerFactionId);
        const pool = strategy.rules.preferTarget === 'playerFirst' ?
          (playerTargets.length ? playerTargets : scouted) : scouted;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        const canAfford = checkStealCost(faction, pick);
        if (!canAfford) continue;
        params = { seatId: pick.id };
        score += (pick.visitorId === gameState.playerFactionId ? 30 : 10) * attacker;
        if (strategy.rules.prioritizeSteal) score += 25;
        break;
      }

      case 'investigate': {
        if (faction.disciplineMarks < 1) continue;
        const targetId = attackMode ? gameState.playerFactionId : pickHostileTarget(factionId);
        const members = gameState.factions[targetId]?.members.filter(m => !m.isUnderInvestigation && m.rank !== '副部') || [];
        if (!members.length) continue;
        // 选目标
        let pick;
        if (strategy.rules.preferInvestigateRank === 'highest') {
          const rankOrder = ['正厅','副厅','正处','副处'];
          for (const r of rankOrder) {
            pick = members.find(m => m.rank === r);
            if (pick) break;
          }
        }
        if (!pick) pick = members[Math.floor(Math.random() * members.length)];
        params = { targetFactionId: targetId, memberId: pick.id };
        score += sit.threatMap[targetId] * 15 * attacker;
        if (strategy.rules.instantInvestigate) score += 20;
        break;
      }

      case 'interrogate': {
        if ((faction.resources.publicSecurity || 0) < 2) continue;
        const target = attackMode ? gameState.playerFactionId : pickHostileTarget(factionId);
        params = { targetFactionId: target };
        score += sit.threatMap[target] * 12 * attacker;
        break;
      }

      case 'raid': {
        if ((faction.resources.publicSecurity || 0) < 3) continue;
        // 优先针对有在攻略席位的派系
        const targets = Object.keys(gameState.factions).filter(fid =>
          fid !== factionId && gameState.npcSeats.some(s => s.visitorId === fid));
        if (!targets.length) continue;
        const target = attackMode && targets.includes(gameState.playerFactionId) ?
          gameState.playerFactionId : targets[Math.floor(Math.random() * targets.length)];
        params = { targetFactionId: target };
        score += sit.threatMap[target] * 15 * attacker;
        break;
      }

      case 'positivePropaganda': {
        if ((faction.resources.propaganda || 0) < 2) continue;
        const taskTypes = ['arrangeSchool','arrangeJob','bailFriend','businessProject'];
        params = { taskType: taskTypes[Math.floor(Math.random() * taskTypes.length)] };
        score += sit.resourceHealth * 8;
        break;
      }

      case 'negativePropaganda': {
        if ((faction.resources.propaganda || 0) < 2) continue;
        const target = attackMode ? gameState.playerFactionId : pickHostileTarget(factionId);
        params = { targetFactionId: target };
        score += sit.threatMap[target] * 10 * attacker;
        break;
      }

      case 'projectBid': {
        if (faction.projectBidUsed) continue;
        if ((faction.resources.housing || 0) < 2) continue;
        const hasTarget = gameState.npcSeats.some(s => s.task.type === 'businessProject' && !s.lockedById && !s._pendingRelease);
        if (!hasTarget) continue;
        params = {};
        score += sit.seatGap * 6;
        break;
      }

      case 'fiveYearPlan': {
        if (faction.fiveYearPlanCooldown > 0) continue;
        if ((faction.resources.ndrc || 0) < 5) continue;
        params = {};
        score += 15;
        break;
      }

      case 'sasacCash': {
        const totalRes = Object.values(faction.resources).reduce((a,b)=>a+b,0) + (faction.genericResources||0);
        if (totalRes < 5) continue;
        const depts = ['sasac','housing','ndrc','finance'];
        const avail = depts.find(d => (faction.resources[d]||0) >= 5) || (faction.genericResources >= 5 ? 'any' : null);
        if (!avail) continue;
        params = { dept: avail };
        score += 10;
        break;
      }

      case 'appointOfficial': {
        if (faction.influence < 5) continue;
        params = {};
        score += strategy.rules.preferAppointOverMerchant ? 18 : 10;
        break;
      }

      case 'boostLoyaltyInfluence': {
        const lowLoyal = faction.members.filter(m => m.loyalty <= (strategy.rules.boostWhenLoyaltyBelow ?? 5));
        if (!lowLoyal.length) continue;
        if (faction.influence < 10 && faction.funds < 1) continue;
        const pick = lowLoyal[0];
        const useFunds = faction.funds >= 1 && faction.influence < 10;
        params = useFunds ? { memberId: pick.id, useFunds: true } : { memberId: pick.id };
        score += (6 - pick.loyalty) * 4;
        if (strategy.rules.boostLoyaltyAggressively) score += 15;
        break;
      }

      case 'merchant': {
        if (faction.influence < 2) continue;
        if (strategy.rules.avoidInvestigate && faction.disciplineMarks > 3) continue; // 纪委标记太多不敢
        params = {};
        score += strategy.rules.preferMerchant ? 20 : 8;
        break;
      }

      default: continue;
    }

    // 混沌因子：对 unpredictable 类型随机扰动
    if (strategy.rules.chaosFactor) {
      score += (Math.random() - 0.5) * score * strategy.rules.chaosFactor * 2;
    }

    // 笑里藏刀：前期压低攻击行动分数
    if (strategy.rules.fakePeaceful && strategy.rules.phaseTrigger) {
      if (gameState.turn < strategy.rules.phaseTrigger) {
        const attackActions = ['investigate','interrogate','raid','stealSeat','negativePropaganda'];
        if (attackActions.includes(action)) score *= 0.2;
      } else {
        // 后期暴起
        if (attackActions.includes(action)) score *= 2.0;
      }
    }

    candidates.push({ type: action, params, score: Math.max(0, Math.round(score)) });
  }

  // 进攻模式：所有攻击行动加权
  if (attackMode) {
    const attackActions = ['stealSeat','investigate','interrogate','raid','negativePropaganda'];
    for (const c of candidates) {
      if (attackActions.includes(c.type)) c.score = Math.round(c.score * attacker);
    }
  }

  // 全有或全无：去掉低分
  if (strategy.rules.allOrNothing) {
    candidates.sort((a, b) => b.score - a.score);
    const top = candidates.slice(0, Math.max(1, Math.floor(candidates.length * 0.4)));
    candidates.length = 0;
    candidates.push(...top);
  }

  // 按分数排序，取前 3 个（85%概率），或随机乱序（15%概率增加变数）
  candidates.sort((a, b) => b.score - a.score);
  if (Math.random() < 0.85) {
    return candidates.slice(0, 3);
  } else {
    return candidates.sort(() => Math.random() - 0.5).slice(0, 3);
  }
}

function checkStealCost(faction, seat) {
  const cost = seat.task.cost * 2;
  if (seat.task.resourceType === 'any') {
    return Object.values(faction.resources).reduce((a,b)=>a+b,0) >= cost;
  }
  return (faction.resources[seat.task.resourceType] || 0) >= cost;
}

function pickHostileTarget(myId) {
  const others = Object.keys(gameState.factions).filter(fid =>
    fid !== myId && fid !== 'npcCongress' && fid !== 'npcCppcc');
  // 优先选席位最多的对手
  others.sort((a, b) => (gameState.factions[b].lockedSeats || 0) - (gameState.factions[a].lockedSeats || 0));
  return others[0] || gameState.playerFactionId;
}
