// src/logic/bribery.js
import { gameState, emit } from './state.js';
import { spendInfluence } from './resources.js';
import { rollDice } from './turn.js';

export function triggerMerchant(factionId) {
  if (!spendInfluence(factionId, 2)) return { success: false, message: '影响力不足' };
  const number = rollDice();
  const faction = gameState.factions[factionId];
  faction.briberyMarks.push({ number, funds: number });
  faction.funds += number;
  emit('bribery:merchant', { factionId, number, funds: number });
  return { success: true, message: `商人上门：受贿标记${number}，获得${number}笔资金` };
}

export function checkBribery(investigatorFactionId, targetFactionId) {
  const target = gameState.factions[targetFactionId];
  if (target.briberyMarks.length === 0) return { success: false, message: '目标无受贿标记' };
  gameState.factions[investigatorFactionId].resources.discipline = (gameState.factions[investigatorFactionId].resources.discipline || 0) - 1;
  const roll = rollDice();
  const hit = target.briberyMarks.some(m => m.number === roll);
  if (hit) {
    const rankMap = { 1: '副处', 2: '正处', 3: '副厅', 4: '副厅', 5: '正厅', 6: '正厅' };
    const victims = target.members.filter(m => m.rank === rankMap[roll] && !m.isUnderInvestigation).slice(0, roll);
    for (const v of victims) { v.investigationStatus = 'evidence'; v.investigationRoundsLeft = 1; }
    return { success: true, message: `检查命中！${victims.length}名干部被查处` };
  }
  return { success: true, message: `检查未命中（骰子${roll}）` };
}
