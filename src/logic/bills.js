// src/logic/bills.js
import { gameState, emit } from './state.js';
import { BILL_POOL, shuffleDeck } from './data/bill-pool.js';
import { FACTION_IDS } from './data/constants.js';

export function drawBill() {
  if (gameState.currentBill) return;
  // 五年计划：额外经济法案
  if (gameState._fiveYearPlanTriggered) {
    gameState._fiveYearPlanTriggered = false;
    gameState._pendingFiveYearPlan = { faction: gameState._fiveYearPlanFaction };
  }
  if (gameState.billDeck.length === 0) gameState.billDeck = shuffleDeck([...BILL_POOL]);
  gameState.currentBill = { ...gameState.billDeck.shift(), votes: { support: [], oppose: [], abstain: [] } };
  gameState.roundLog.push({ factionId: 'system', action: 'billResult', target: `📜 ${gameState.currentBill.name} 表决开始`, result: '投票中' });
  emit('bill:drawn', { bill: gameState.currentBill });
}

export function castVote(factionId, stance) {
  const bill = gameState.currentBill;
  if (!bill) return { success: false, message: '没有待投票的法案' };
  const allVotes = [...bill.votes.support, ...bill.votes.oppose, ...bill.votes.abstain];
  if (allVotes.find(v => v.factionId === factionId)) return { success: false, message: '已投票' };
  const faction = gameState.factions[factionId];
  let weight = 0;
  for (const m of faction.members) {
    if (m.investigationStatus === 'evidence') continue;
    if (m.rank === '正厅') weight += 1.5;
    else if (m.rank === '副厅') weight += 1;
  }
  bill.votes[stance].push({ factionId, weight });
  emit('bill:voted', { factionId, stance, weight });
  return { success: true };
}

export function resolveBill() {
  const bill = gameState.currentBill;
  const supportWeight = bill.votes.support.reduce((s, v) => s + v.weight, 0);
  const opposeWeight = bill.votes.oppose.reduce((s, v) => s + v.weight, 0);
  const totalWeight = supportWeight + opposeWeight;
  const passed = totalWeight > 0 && supportWeight / totalWeight > 0.5;
  for (const v of bill.votes.support) {
    const f = gameState.factions[v.factionId];
    f.influence += passed ? ({ '副部': 10, '正厅': 6, '副厅': 4 }[f.leaderRank] || 4) : 0;
  }
  if (!passed) {
    for (const v of bill.votes.oppose) {
      const f = gameState.factions[v.factionId];
      f.influence += { '副部': 12, '正厅': 8, '副厅': 5 }[f.leaderRank] || 5;
    }
    for (const v of bill.votes.support) {
      const f = gameState.factions[v.factionId];
      for (const d of Object.keys(f.resources)) f.resources[d] = Math.floor(f.resources[d] / 2);
    }
  }
  if (passed && bill.passEffects) gameState.activeBillEffects.push({ id: bill.id, name: bill.name + '（通过）', effects: bill.passEffects, duration: bill.passEffects.duration || 1 });
  if (!passed && bill.failEffects && Object.keys(bill.failEffects).length > 0) gameState.activeBillEffects.push({ id: bill.id + '_fail', name: bill.name + '（未通过）', effects: bill.failEffects, duration: bill.failEffects.duration || 1 });
  const result = { passed, supportWeight, opposeWeight, billName: bill.name, billDesc: bill.description, passEffects: bill.passEffects, failEffects: bill.failEffects };
  gameState.lastBillResult = result;
  gameState.roundLog.push({ factionId: 'system', action: 'billResult', target: bill.name, result: passed ? '通过' : '未通过', detail: `${passed ? '支持' : '反对'} ${supportWeight}票:${opposeWeight}票` });
  emit('bill:resolved', result);
  gameState.currentBill = null;
  // 五年计划：常规法案结束后额外触发一个经济法案
  if (gameState._pendingFiveYearPlan) {
    const firstResult = result;
    const pf = gameState._pendingFiveYearPlan;
    gameState._pendingFiveYearPlan = null;
    const fiveYearBills = [
      { id: 'fiveyear_infra', name: '【五年计划】基础设施建设', description: '大规模基建投资拉动经济。通过后全体资源+1、住建+2、任务消耗-1（2轮）；否决后住建厅资源-2。', passEffects: { globalResourceBonus: 1, housingResourceBonus: 2, taskCostReduction: 1, duration: 2 }, failEffects: { housingResourcePenalty: 2, duration: 1 } },
      { id: 'fiveyear_soe', name: '【五年计划】国企改革方案', description: '深化国企改革提升效率。通过后政府资源+1、国资委+2、任用消耗-2（2轮）；否决后国资委资源-2。', passEffects: { govResourceBonus: 1, sasacResourceBonus: 2, appointmentCostReduction: 2, duration: 2 }, failEffects: { sasacResourcePenalty: 2, duration: 1 } },
      { id: 'fiveyear_green', name: '【五年计划】绿色能源转型', description: '推动绿色能源可持续发展。通过后全体资源+2、发改委+2（2轮）；否决后发改委资源-2。', passEffects: { globalResourceBonus: 2, ndrcResourceBonus: 2, duration: 2 }, failEffects: { ndrcResourcePenalty: 2, duration: 1 } }
    ];
    const eBill = fiveYearBills[Math.floor(Math.random() * fiveYearBills.length)];
    gameState.currentBill = { ...eBill, votes: { support: [], oppose: [], abstain: [] } };
    gameState.roundLog.push({ factionId: 'system', action: 'billResult', target: `📜 ${gameState.currentBill.name} 表决开始`, result: '投票中' });
      castVote(pf.faction, 'support');
      for (const fid of FACTION_IDS) {
        if (fid === pf.faction) continue;
        castVote(fid, ['support', 'oppose', 'abstain'][Math.floor(Math.random() * 3)]);
      }
      const r2 = resolveBill();
      gameState.lastBillResult = r2;
      gameState.lastBillResult2 = firstResult;
    }
  }
  return result;
}

// Apply active bill effects to a faction's behavior
export function getBillEffectBonus(factionId) {
  let bonus = { resourceMult: 1, taskCostReduction: 0, influenceBonus: 0, appointmentDiscount: 0 };
  for (const e of gameState.activeBillEffects) {
    const eff = e.effects;
    if (eff.globalResourceBonus) bonus.resourceMult += eff.globalResourceBonus;
    if (eff.govResourceBonus && gameState.factions[factionId].leaderDept) bonus.resourceMult += eff.govResourceBonus;
    if (eff.taskCostReduction) bonus.taskCostReduction += eff.taskCostReduction;
    if (eff.appointmentCostReduction) bonus.appointmentDiscount += eff.appointmentCostReduction;
    if (eff.supporterInfluenceBonus) bonus.influenceBonus += eff.supporterInfluenceBonus;
  }
  return bonus;
}

export function getBillEffectDescriptions() {
  return gameState.activeBillEffects.map(e => {
    const eff = e.effects;
    const parts = [];
    if (eff.globalResourceBonus) parts.push(`全体资源+${eff.globalResourceBonus}`);
    if (eff.govResourceBonus) parts.push(`政府资源+${eff.govResourceBonus}`);
    if (eff.taskCostReduction) parts.push(`任务消耗-${eff.taskCostReduction}`);
    if (eff.appointmentCostReduction) parts.push(`任用消耗-${eff.appointmentCostReduction}`);
    if (eff.govPartyExchange) parts.push('跨部门互通');
    if (eff.blockPublicSecurity) parts.push('公安封锁');
    if (eff.disableResources) parts.push('资源瘫痪');
    if (eff.partySchoolBonus) parts.push('党校+1');
    if (eff.disciplineSuccessBoost) parts.push('查处强化');
    if (eff.banDisciplineAction) parts.push('禁纪委行动');
    return `${e.name || e.id}：${parts.join('，')}（剩${e.duration}轮）`;
  });
}
