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
      // 发起经济投票：先给当前全局加经济红利，在法案阶段额外触发一个经济法案
      gameState._fiveYearPlanTriggered = true;
      gameState._fiveYearPlanFaction = factionId;
      return { success: true, message: '五年计划提案已发起！将在本轮法案阶段进行经济投票。' };
    case 'projectVeto':
      if (faction.projectVetoUsed) return { success: false, message: '本轮已使用' };
      if (!spendResources(factionId, 'ndrc', 2)) return { success: false, message: '发改资源不足' };
      faction.projectVetoUsed = true;
      return { success: true, message: '已阻挠对手商人项目' };
    case 'sasacCash':
      // 资源变现：可用国资委/住建厅/发改委/财政厅/通用 各5单位
      if (params.dept) {
        if (params.dept === 'generic') {
          if ((faction.genericResources || 0) < 5) return { success: false, message: '通用资源不足' };
          faction.genericResources -= 5;
        } else {
          if (!spendResources(factionId, params.dept, 5)) return { success: false, message: '资源不足（需5单位）' };
        }
      } else {
        if (!spendResources(factionId, 'sasac', 5)) return { success: false, message: '国资委资源不足' };
      }
      faction.funds += 1;
      return { success: true, message: '获得1笔可用资金' };
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
      // 找第一个 businessProject 类型且未锁定的席位
      let bidSeat = null;
      for (const s of gameState.npcSeats) {
        if (s.task.type === 'businessProject' && !s.lockedById && s.visitorId !== factionId) {
          bidSeat = s; break;
        }
      }
      let msg = '项目招标成功！';
      if (bidSeat) {
        bidSeat.lockedById = factionId;
        bidSeat.visitorId = null;
        bidSeat.lockedOnTurn = gameState.turn;
        faction.lockedSeats++;
        msg += `${bidSeat.name}已被锁定，`;
      }
      // 免费拜访1次（下次拜访不消耗影响力）
      faction._freeVisit = true;
      msg += '获得1次免费拜访';
      return { success: true, message: msg };
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
