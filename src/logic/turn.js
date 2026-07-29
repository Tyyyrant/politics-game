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
    gameState.factions[fid]._freeVisit = false;
    if (gameState.factions[fid].fiveYearPlanCooldown > 0) gameState.factions[fid].fiveYearPlanCooldown--;
  }
  // Produce resources for everyone at round start
  for (const fid of FACTION_IDS) {
    produceResources(fid);
  }
  gameState._fiveYearPlanTriggered = false;
  gameState._pendingFiveYearPlan = null;
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
  const taskDefs = [
    { type: 'arrangeSchool', costMin: 1, costMax: 2, resource: 'education' },
    { type: 'arrangeJob', costMin: 1, costMax: 2, resource: 'sasac' },
    { type: 'bailFriend', costMin: 1, costMax: 2, resource: 'publicSecurity' },
    { type: 'businessProject', costMin: 1, costMax: 2, resource: 'housing' },
    { type: 'buildConnections', costMin: 2, costMax: 2, resource: 'any' }
  ];
  for (const seat of gameState.npcSeats) {
    // 未锁定的拜访席位倒计时
    if (seat.visitorId && !seat.lockedById) {
      seat.roundsRemaining--;
      if (seat.roundsRemaining <= 0) {
        emit('seat:expired', { seatId: seat.id, visitorId: seat.visitorId });
        seat.visitorId = null;
        seat.roundsRemaining = 3;
      }
    }
    // 锁定席位3轮后刷新任务
    if (seat.lockedById) {
      if (!seat.lockedOnTurn) seat.lockedOnTurn = gameState.turn;
      if (gameState.turn - seat.lockedOnTurn >= 3 && !seat._lockTaskRefreshed) {
        const previousOwner = seat.lockedById;
        seat._lockTaskRefreshed = true;
        const def = taskDefs[Math.floor(Math.random() * taskDefs.length)];
        seat.refreshCount = (seat.refreshCount || 0) + 1;
        const baseCost = def.costMin + Math.floor(Math.random() * (def.costMax - def.costMin + 1));
        const cost = baseCost + (seat.refreshCount - 1) * 2;
        seat.task = { type: def.type, cost, resourceType: def.resource };
        seat.visitorId = seat.lockedById;
        seat.lockedById = null;
        seat.lockedOnTurn = null;
        seat.roundsRemaining = 3;
        seat.visitedOnTurn = gameState.turn;
        seat.revealed = true;
        seat._lockTaskRefreshed = false;
        seat._pendingRelease = true;
        // 只提示自己派系的席位刷新
        if (previousOwner === gameState.playerFactionId) {
          gameState.roundLog.push({ factionId: 'system', action: 'seatRefresh', target: `${seat.name}代表有了新的任务`, result: '需在2轮内完成' });
        }
      }
      // 刷新后的任务倒计时
      if (seat._pendingRelease && !seat.lockedById) {
        seat.roundsRemaining--;
        if (seat.roundsRemaining <= 0) {
          const previousOwner = seat.visitorId;
          seat.visitorId = null;
          seat._pendingRelease = false;
          seat.revealed = false;
          seat.roundsRemaining = 3;
          if (previousOwner === gameState.playerFactionId) {
            gameState.roundLog.push({ factionId: 'system', action: 'seatRefresh', target: `${seat.name}代表的任务过期`, result: '席位已释放' });
          }
        }
      }
    }
  }
  gameState.activeBillEffects = gameState.activeBillEffects.filter(e => {
    const keep = e.duration > 0;
    if (keep) e.duration--;
    return keep;
  });
  if (gameState.turn % 2 === 0) {
    // 每2轮所有派系获得纪委标记（基于纪委部门成员数量）
    for (const fid of FACTION_IDS) {
      const faction = gameState.factions[fid];
      const discMembers = faction.members.filter(m => m.dept === 'discipline' && m.investigationStatus !== 'evidence');
      faction.disciplineMarks += discMembers.length;
    }
  }
  // 每3轮为无待办追求的成员刷新一个新追求（不重复）
  if (gameState.turn % 3 === 0) {
    const questPool = ['小孩升学', '购买新房', '安排工作', '结识贵人', '政治追求'];
    for (const fid of FACTION_IDS) {
      for (const m of gameState.factions[fid].members) {
        if (m.personalQuests.length === 0 && m.completedQuests.length < questPool.length) {
          const available = questPool.filter(q => !m.completedQuests.includes(q));
          if (available.length > 0) {
            const newQuest = available[Math.floor(Math.random() * available.length)];
            m.personalQuests.push(newQuest);
          }
        }
      }
    }
  }
  checkVictory();
  emit('turn:cleanup-done');
}
