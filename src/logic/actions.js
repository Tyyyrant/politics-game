// src/logic/actions.js
import { gameState, emit } from './state.js';
import { spendResources, spendAnyResources, spendInfluence } from './resources.js';
import { rollDice } from './turn.js';
import { ACTION_TYPES, INVESTIGATE_COST } from './data/constants.js';

export function getMaxVisits(factionId) {
  const faction = gameState.factions[factionId];
  if (!faction) return 2;
  const memberCount = faction.members.length; // 不含首领
  return 1 + Math.floor(memberCount / 4);
}

export function executeAction(factionId, actionType, params = {}) {
  switch (actionType) {
    case ACTION_TYPES.VISIT_SEAT: return visitSeat(factionId, params.seatId);
    case ACTION_TYPES.COMPLETE_TASK: return completeTask(factionId, params.seatId);
    case ACTION_TYPES.SCOUT_SEAT: return scoutSeat(factionId, params.seatId);
    case ACTION_TYPES.STEAL_SEAT: return stealSeat(factionId, params.seatId);
    case ACTION_TYPES.SCOUT_LOYALTY: return scoutLoyalty(factionId, params.targetFactionId, params.memberId);
    case ACTION_TYPES.SCOUT_RESOURCES: return scoutResources(factionId, params.targetFactionId);
    case ACTION_TYPES.INVESTIGATE: return investigate(factionId, params.targetFactionId, params.memberId);
    case ACTION_TYPES.SCOUT_QUESTS: return scoutQuests(factionId, params.targetFactionId, params.memberId);
    case ACTION_TYPES.COMPLETE_ENEMY_QUEST: return completeEnemyQuest(factionId, params.targetFactionId, params.memberId);
    case ACTION_TYPES.END_TURN: emit('action:end-turn', { factionId }); return { success: true, message: '结束回合' };
    default: return { success: false, message: '未知行动' };
  }
}

function visitSeat(factionId, seatId) {
  const maxVisits = getMaxVisits(factionId);
  if (gameState.factions[factionId].visitsThisTurn >= maxVisits) return { success: false, message: `每轮最多拜访${maxVisits}个席位` };
  if (!spendInfluence(factionId, 1)) return { success: false, message: '影响力不足（需要1点）' };
  const seat = gameState.npcSeats.find(s => s.id === seatId);
  if (!seat) return { success: false, message: '席位不存在' };
  if (seat.lockedById) return { success: false, message: '该席位已被锁定' };
  if (seat.visitorId === factionId) return { success: false, message: '你已在攻略此席位，无需重复拜访' };
  if (seat.visitorId && seat.visitorId !== factionId) return { success: false, message: '已有其他派系在攻略' };
  seat.visitorId = factionId;
  seat.roundsRemaining = 3;  // 从下轮开始算，保证2个完整行动回合
  seat.visitedOnTurn = gameState.turn;
  if (factionId === gameState.playerFactionId) seat.revealed = true;
  gameState.factions[factionId].visitsThisTurn++;
  emit('seat:visited', { factionId, seatId, task: seat.revealed ? seat.task : null });
  const isPlayer = factionId === gameState.playerFactionId;
  gameState.roundLog.push({ factionId, action: 'visitSeat', target: isPlayer ? `${seat.name}` : '某席位', result: '开始攻略' });
  return { success: true, message: `已拜访${seat.name}`, data: seat.revealed ? seat.task : null };
}

function completeTask(factionId, seatId) {
  const seat = gameState.npcSeats.find(s => s.id === seatId);
  if (!seat || seat.visitorId !== factionId) return { success: false, message: '你未在攻略此席位' };
  if (seat.visitedOnTurn === gameState.turn) return { success: false, message: '本回合刚拜访，请下回合再完成任务' };
  let cost = seat.task.cost;
  for (const be of gameState.activeBillEffects) {
    if (be.effects.taskCostReduction && (!be.effects.taskType || be.effects.taskType === seat.task.type)) {
      cost = Math.max(1, cost - be.effects.taskCostReduction);
    }
  }
  const spent = seat.task.resourceType === 'any' ? spendAnyResources(factionId, cost) : spendResources(factionId, seat.task.resourceType, cost);
  if (!spent) return { success: false, message: '资源不足' };
  seat.lockedById = factionId; seat.visitorId = null;
  seat.lockedOnTurn = gameState.turn; seat._pendingRelease = false;
  gameState.factions[factionId].lockedSeats++;
  emit('seat:locked', { factionId, seatId });
  const isPlayer2 = factionId === gameState.playerFactionId;
  gameState.roundLog.push({ factionId, action: 'completeTask', target: isPlayer2 ? `${seat.name}` : '某席位', result: '锁定成功' });
  return { success: true, message: `成功锁定${seat.name}！` };
}

function scoutSeat(factionId, seatId) {
  const seat = gameState.npcSeats.find(s => s.id === seatId);
  if (!seat || !seat.visitorId) return { success: false, message: '该席位无人攻略，无需打探' };
  if (!seat.scoutedBy) seat.scoutedBy = [];
  if (seat.scoutedBy.includes(factionId)) return { success: false, message: '你已经探查过该席位了' };
  if (!spendInfluence(factionId, 1)) return { success: false, message: '影响力不足（需要1点）' };
  seat.scoutedBy.push(factionId);
  return { success: true, message: '打探成功', data: { task: seat.task, visitorId: seat.visitorId, roundsLeft: seat.roundsRemaining } };
}

function stealSeat(factionId, seatId) {
  if (gameState.turn <= 1) return { success: false, message: '第一轮不能抢夺席位' };
  const seat = gameState.npcSeats.find(s => s.id === seatId);
  if (!seat || !seat.visitorId || seat.visitorId === factionId) return { success: false, message: '无法抢夺' };
  if (!seat.scoutedBy || !seat.scoutedBy.includes(factionId)) return { success: false, message: '必须先打探该席位才能抢夺' };
  if (!spendInfluence(factionId, 2)) return { success: false, message: '影响力不足' };
  const spent = seat.task.resourceType === 'any' ? spendAnyResources(factionId, seat.task.cost * 2) : spendResources(factionId, seat.task.resourceType, seat.task.cost * 2);
  if (!spent) return { success: false, message: '双倍资源不足' };
  const victimId = seat.visitorId;
  // 直接锁定席位（抢夺就是花双倍资源直接完成）
  seat.lockedById = factionId;
  seat.visitorId = null;
  gameState.factions[factionId].lockedSeats++;
  const isPlayer3 = factionId === gameState.playerFactionId;
  gameState.roundLog.push({ factionId, action: 'stealSeat', target: isPlayer3 ? `${seat.name}` : '某席位', result: '抢夺锁定' });
  emit('seat:locked', { factionId, seatId });
  return { success: true, message: `抢夺成功！${seat.name}已直接锁定` };
}

function investigate(factionId, targetFactionId, memberId) {
  const targetFaction = gameState.factions[targetFactionId];
  const member = targetFaction.members.find(m => m.id === memberId);
  if (!member) return { success: false, message: '目标不存在' };
  const cost = INVESTIGATE_COST[member.rank];
  if (gameState.factions[factionId].disciplineMarks < cost) return { success: false, message: '纪委标记不足' };
  gameState.factions[factionId].disciplineMarks -= cost;
  const roll = rollDice();
  let result;
  if (roll <= 2) { result = '无证据'; member.investigationStatus = null; }
  else if (roll <= 4) { result = '嫌疑'; member.investigationStatus = 'suspect'; member.investigationRoundsLeft = 1; }
  else { result = '证据确凿'; member.investigationStatus = 'evidence'; member.investigationRoundsLeft = 1; }
  emit('investigation:result', { factionId, targetFactionId, memberId, roll, result });
  gameState.roundLog.push({ factionId, action: 'investigate', target: `${member.name}(${targetFactionId})`, roll, result });
  return { success: true, message: `查处${member.name}：骰子${roll}点 → ${result}`, data: { roll, result } };
}

function scoutLoyalty(factionId, targetFactionId, memberId) {
  if (gameState.factions[factionId].resources.publicSecurity) {
    if (!spendResources(factionId, 'publicSecurity', 1)) return { success: false, message: '资源不足' };
  } else {
    if (!spendInfluence(factionId, 2)) return { success: false, message: '影响力不足' };
  }
  const member = gameState.factions[targetFactionId].members.find(m => m.id === memberId);
  if (!member) return { success: false, message: '目标不存在' };
  return { success: true, message: '打探成功', data: { loyalty: member.loyalty, traits: member.traits } };
}

function scoutResources(factionId, targetFactionId) {
  if (!spendInfluence(factionId, 3)) return { success: false, message: '影响力不足' };
  const target = gameState.factions[targetFactionId];
  return { success: true, message: '打探成功', data: { resources: { ...target.resources }, influence: target.influence } };
}

// 打探对手成员的个人追求
function scoutQuests(factionId, targetFactionId, memberId) {
  if (!spendInfluence(factionId, 1)) return { success: false, message: '影响力不足（需1点）' };
  const member = gameState.factions[targetFactionId]?.members.find(m => m.id === memberId);
  if (!member) return { success: false, message: '目标不存在' };
  return { success: true, message: `已打探${member.name}的个人追求`, data: { quests: member.personalQuests, traits: member.traits } };
}

// 帮对手成员完成个人追求来拉拢（结识贵人由UI层处理资源选择）
function completeEnemyQuest(factionId, targetFactionId, memberId) {
  const targetFaction = gameState.factions[targetFactionId];
  const member = targetFaction?.members.find(m => m.id === memberId);
  if (!member || member.personalQuests.length === 0) return { success: false, message: '该成员无待完成的个人追求' };
  const quest = member.personalQuests[0];
  if (quest === '结识贵人') return { success: false, message: '请使用界面按钮完成' };
  let cost = 0, dept = null;
  switch (quest) {
    case '小孩升学': cost = 1; dept = 'education'; break;
    case '购买新房': cost = 1; dept = 'housing'; break;
    case '安排工作': cost = 1; dept = 'sasac'; break;
    default: return { success: false, message: '无法完成的追求类型' };
  }
  if (!spendResources(factionId, dept, cost)) return { success: false, message: `资源不足（需${cost} ${dept}资源）` };
  member.personalQuests.shift();
  member.completedQuests.push(quest);
  member.loyalty = Math.max(0, member.loyalty - 3);
  gameState.roundLog.push({ factionId, action: 'completeEnemyQuest', target: `${member.name}(${targetFactionId})`, result: `完成${quest}` });
  if (member.loyalty <= 0) {
    targetFaction.members = targetFaction.members.filter(m => m.id !== memberId);
    member.loyalty = 4;
    member.traits = member.traits.filter(t => !['心腹嫡系','利益共同体','小孩升学','购买新房','安排工作','政治追求','结识贵人'].includes(t));
    member.personalQuests = [];
    member.completedQuests = [];
    member.id = `${factionId}_${member.name}`;
    gameState.factions[factionId].members.push(member);
    return { success: true, message: `良禽择木而栖，${member.name}已加入您的派系。` };
  }
  return { success: true, message: `${member.name}十分感谢您的帮助，来日有机会愿效犬马之劳。` };
}
