// src/logic/quests.js
import { gameState, emit } from './state.js';
import { GOVERNANCE_QUESTS, FOLLOWUP_QUESTS } from './data/governance-quests.js';
import { spendResources } from './resources.js';

// 每回合为指定派系生成新政务
export function generateQuests(factionId) {
  const faction = gameState.factions[factionId];
  if (!faction.activeQuests) faction.activeQuests = [];
  if (!faction.completedQuestIds) faction.completedQuestIds = [];

  // 每回合最多 2 个活跃任务
  const maxActive = 3;
  if (faction.activeQuests.length >= maxActive) return;

  // 取 1-2 个新任务
  const count = Math.min(1 + Math.floor(Math.random() * 2), maxActive - faction.activeQuests.length);
  const available = GOVERNANCE_QUESTS.filter(q =>
    !faction.activeQuests.some(a => a.id === q.id) &&
    !faction.completedQuestIds.includes(q.id)
  );

  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(Math.random() * available.length);
    const quest = available.splice(idx, 1)[0];
    faction.activeQuests.push({
      id: quest.id,
      title: quest.title,
      desc: quest.desc,
      category: quest.category,
      deadline: quest.deadline,
      remaining: quest.deadline,
      options: quest.options.map(o => ({ ...o })),
      createdOnTurn: gameState.turn,
    });
  }
}

// 玩家完成政务
export function completeQuest(factionId, questId, optionIdx) {
  const faction = gameState.factions[factionId];
  if (!faction.activeQuests) return { success: false, message: '无活跃任务' };
  const qi = faction.activeQuests.findIndex(q => q.id === questId);
  if (qi < 0) return { success: false, message: '任务已过期或不存在' };

  const quest = faction.activeQuests[qi];
  const option = quest.options[optionIdx];
  if (!option) return { success: false, message: '无效选项' };

  // 支付资源
  if (option.cost) {
    for (const [dept, amt] of Object.entries(option.cost)) {
      if (dept === 'funds') {
        if ((faction.funds || 0) < amt) return { success: false, message: `可用资金不足（需${amt}笔）` };
        faction.funds -= amt;
      } else {
        if (!spendResources(factionId, dept, amt)) {
          return { success: false, message: `${dept}资源不足（需${amt}）` };
        }
      }
    }
  }

  // 应用效果
  applyEffects(factionId, option.effects);

  // 记录完成
  faction.activeQuests.splice(qi, 1);
  if (!faction.completedQuestIds) faction.completedQuestIds = [];
  faction.completedQuestIds.push(quest.id);

  const msg = `已完成政务「${quest.title}」`;
  gameState.roundLog.push({ factionId, action: 'completeQuest', target: quest.title, result: msg });
  return { success: true, message: msg };
}

// 每回合结束时检查过期任务
export function checkQuestExpiry(factionId) {
  const faction = gameState.factions[factionId];
  if (!faction.activeQuests) return;

  const expired = [];
  for (let i = faction.activeQuests.length - 1; i >= 0; i--) {
    const q = faction.activeQuests[i];
    q.remaining--;
    if (q.remaining <= 0) {
      // 默认惩罚：-2 民意值
      applyEffects(factionId, { popularity: -2 });
      expired.push(q.title);
      faction.activeQuests.splice(i, 1);
      // 连锁任务：某些任务过期也可能触发后续
      checkFollowUp(factionId, q.id, -1);
    }
  }
  if (expired.length) {
    gameState.roundLog.push({ factionId, action: 'questExpired', target: expired.join('、'), result: '政务过期-2民意' });
  }
}

// 检查连锁任务
export function checkFollowUp(factionId, questId, chosenOptionIdx) {
  const faction = gameState.factions[factionId];
  const quest = GOVERNANCE_QUESTS.find(q => q.id === questId);
  if (!quest || chosenOptionIdx < 0) return;

  const option = quest.options[chosenOptionIdx];
  if (!option || !option.followUp) return;

  const followUpId = option.followUp;
  const followUp = FOLLOWUP_QUESTS[followUpId];
  if (!followUp) return;
  if (faction.completedQuestIds?.includes(followUpId)) return;
  if (faction.activeQuests?.some(q => q.id === followUpId)) return;

  // 延迟 2 轮后加入
  if (!faction._pendingFollowUps) faction._pendingFollowUps = [];
  faction._pendingFollowUps.push({ questId: followUpId, triggerOnTurn: gameState.turn + 2 });
}

// 处理延迟连锁任务
export function processPendingFollowUps(factionId) {
  const faction = gameState.factions[factionId];
  if (!faction._pendingFollowUps) return;
  const now = gameState.turn;
  const ready = faction._pendingFollowUps.filter(p => p.triggerOnTurn <= now);
  faction._pendingFollowUps = faction._pendingFollowUps.filter(p => p.triggerOnTurn > now);

  for (const p of ready) {
    const quest = FOLLOWUP_QUESTS[p.questId];
    if (!quest) continue;
    if (faction.activeQuests?.some(q => q.id === quest.id)) continue;
    if (faction.completedQuestIds?.includes(quest.id)) continue;
    faction.activeQuests.push({
      id: quest.id,
      title: quest.title,
      desc: quest.desc,
      category: quest.category,
      deadline: quest.deadline,
      remaining: quest.deadline,
      options: quest.options.map(o => ({ ...o })),
      createdOnTurn: now,
    });
    if (factionId === gameState.playerFactionId) {
      gameState.roundLog.push({ factionId: 'system', action: 'followUp', target: quest.title, result: '连锁任务触发' });
    }
  }
}

// 应用效果
function applyEffects(factionId, effects) {
  if (!effects) return;
  const faction = gameState.factions[factionId];

  if (effects.popularity) {
    faction.popularity = Math.min(100, Math.max(0, (faction.popularity || 50) + effects.popularity));
  }
  if (effects.influence) {
    faction.influence = Math.max(0, (faction.influence || 0) + effects.influence);
  }
  if (effects.funds) {
    faction.funds = Math.max(0, (faction.funds || 0) + effects.funds);
  }
}

// 民意值影响力加成（每回合额外产出）
export function getPopularityBonus(factionId) {
  const pop = gameState.factions[factionId]?.popularity || 50;
  return Math.floor(pop * 0.2); // 100点=+20/回合，50点=+10/回合
}

// AI 自动选择政务选项
export function aiChooseQuestOption(factionId, questId) {
  const faction = gameState.factions[factionId];
  const quest = faction.activeQuests?.find(q => q.id === questId);
  if (!quest) return -1;

  const strategy = gameState.aiStrategies[factionId];
  const isAggressive = strategy?.category === 'aggressive' || strategy?.category === 'unpredictable';

  // 简单策略：选一个能负担得起的最好选项
  let bestIdx = 0;
  let bestScore = -999;
  for (let i = 0; i < quest.options.length; i++) {
    const opt = quest.options[i];
    let score = (opt.effects?.popularity || 0) * 2 + (opt.effects?.influence || 0) * 1;
    if (isAggressive && (opt.effects?.popularity || 0) < 0) score += 5; // 激进型不在乎民意

    // 检查能否负担
    let canAfford = true;
    if (opt.cost) {
      for (const [dept, amt] of Object.entries(opt.cost)) {
        if (dept === 'funds') {
          if ((faction.funds || 0) < amt) { canAfford = false; break; }
        } else {
          if ((faction.resources[dept] || 0) < amt) { canAfford = false; break; }
        }
      }
    }
    if (!canAfford) score -= 50;

    if (score > bestScore) { bestScore = score; bestIdx = i; }
  }

  // 如果最差选项扣民意太多（-3以上），AI可能选择不做
  // 激进型20%概率选择最省资源的
  if (isAggressive && Math.random() < 0.2 && quest.options.length > 1) {
    let cheapest = 0;
    let cheapestCost = 999;
    for (let i = 0; i < quest.options.length; i++) {
      let totalCost = 0;
        const cc = quest.options[i].cost || {};
        for (const [kk, vv] of Object.entries(cc)) {
          if (kk === 'funds') totalCost += vv * 5;
          else totalCost += vv;
        }
      if (totalCost < cheapestCost) { cheapestCost = totalCost; cheapest = i; }
    }
    return cheapest;
  }

  return bestIdx;
}
