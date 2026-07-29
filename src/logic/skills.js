// src/logic/skills.js
import { gameState, emit } from './state.js';
import { spendResources } from './resources.js';
import { FACTION_NAMES_CN } from './data/constants.js';

export function executeSkill(factionId, skillId, params = {}) {
  const faction = gameState.factions[factionId];
  switch (skillId) {
    case 'fiveYearPlan':
      if (faction.fiveYearPlanCooldown > 0) return { success: false, message: `冷却中（${faction.fiveYearPlanCooldown}轮）` };
      if (!spendResources(factionId, 'ndrc', 5)) return { success: false, message: '发改资源不足' };
      faction.fiveYearPlanCooldown = 3;
      // 给发起者全资源+2作为经济刺激效果
      for (const dept of Object.keys(faction.resources)) {
        faction.resources[dept] = (faction.resources[dept] || 0) + 2;
      }
      faction.genericResources = (faction.genericResources || 0) + 2;
      gameState.roundLog.push({ factionId, action: 'fiveYearPlan', target: '五年计划', result: '全资源+2，通用+2' });
      return { success: true, message: '五年计划已启动！全部资源+2，通用资源+2' };
    case 'projectVeto':
      if (faction.projectVetoUsed) return { success: false, message: '本轮已使用' };
      if (!spendResources(factionId, 'ndrc', 2)) return { success: false, message: '发改资源不足' };
      faction.projectVetoUsed = true;
      return { success: true, message: '已阻挠对手商人项目' };
    case 'sasacCash':
      if (!spendResources(factionId, 'sasac', 5)) return { success: false, message: '国资委资源不足' };
      faction.funds += 1;
      return { success: true, message: '获得1笔可用资金（不留记录）' };
    case 'interrogate':
      if (faction.interrogateUsed >= 2) return { success: false, message: '本轮审讯次数已用完' };
      if (!spendResources(factionId, 'publicSecurity', 2)) return { success: false, message: '公安资源不足' };
      faction.interrogateUsed++;
      gameState.activeBillEffects.push({ id: `interrogate_${params.targetFactionId}`, effects: { disableResources: true }, duration: 1 });
      emit('skill:interrogate', { factionId, target: params.targetFactionId });
      return { success: true, message: '审讯已执行' };
    case 'raid':
      if (faction.raidUsed) return { success: false, message: '本轮已使用' };
      if (!spendResources(factionId, 'publicSecurity', 3)) return { success: false, message: '公安资源不足' };
      faction.raidUsed = true;
      // 释放目标正在攻略的席位
      const targetId = params.targetFactionId;
      if (targetId) {
        let freed = 0;
        for (const seat of gameState.npcSeats) {
          if (seat.visitorId === targetId && !seat.lockedById) {
            seat.visitorId = null;
            seat.roundsRemaining = 3;
            seat.revealed = false;
            freed++;
          }
        }
        return { success: true, message: `突击检查已执行，释放了${targetId === factionId ? '自己' : FACTION_NAMES_CN[targetId] || targetId}的${freed}个席位` };
      }
      return { success: true, message: '突击检查已执行' };
    case 'projectBid':
      if (faction.projectBidUsed) return { success: false, message: '本轮已使用' };
      if (!spendResources(factionId, 'housing', 2)) return { success: false, message: '住建资源不足' };
      faction.projectBidUsed = true;
      // 完成一个商人项目席位：找第一个 businessProject 类型且未被锁定的席位
      let bidSeat = null;
      for (const s of gameState.npcSeats) {
        if (s.task.type === 'businessProject' && !s.lockedById && s.visitorId !== factionId) {
          bidSeat = s; break;
        }
      }
      if (bidSeat) {
        bidSeat.lockedById = factionId;
        bidSeat.visitorId = null;
        bidSeat.lockedOnTurn = gameState.turn;
        bidSeat._pendingRelease = false;
        faction.lockedSeats++;
        faction.visitsThisTurn = Math.max(0, (faction.visitsThisTurn || 0) - 1); // 免费拜访1次
        return { success: true, message: `项目招标成功！${bidSeat.name}已被锁定，并获得1次免费拜访` };
      }
      return { success: true, message: '项目招标成功！但当前没有可锁定的商人项目席位' };
    case 'positivePropaganda':
      if (!spendResources(factionId, 'propaganda', 2)) return { success: false, message: '宣传资源不足' };
      gameState.activeBillEffects.push({ id: `positive_${params.taskType}`, name: `正面宣传（${params.taskType}）`, effects: { taskCostReduction: 1, taskType: params.taskType }, duration: 1 });
      return { success: true, message: '正面宣传已发出' };
    case 'negativePropaganda':
      if (!spendResources(factionId, 'propaganda', 2)) return { success: false, message: '宣传资源不足' };
      gameState.factions[params.targetFactionId].influence = Math.max(0, (gameState.factions[params.targetFactionId].influence || 0) - 2);
      return { success: true, message: '负面曝光已发出' };
    case 'rerollDice':
      if (!spendResources(factionId, 'legalAffairs', 4)) return { success: false, message: '政法委资源不足' };
      return { success: true, message: '骰子已重投' };
    default: return { success: false, message: '未知技能' };
  }
}
