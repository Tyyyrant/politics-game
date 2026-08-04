// src/logic/bargaining.js
// AI 外交消息系统 — 投票前拉拢/施压玩家

import { gameState } from './state.js';

// 消息模板库
const MESSAGES = {
  support: {
    aggressive: [
      '识相的就支持，否则别怪我不客气。',
      '这次你站我这边，以前的事一笔勾销。',
      '别犯蠢，投票支持对大家都好。',
    ],
    moderate: [
      '这个法案通过的话，对你我都有利，考虑一下？',
      '我分析过了，支持是最优解。卖我个人情如何？',
      '我建议你支持，事后必有重谢。',
    ],
    defensive: [
      '此事关乎大局，恳请你投支持票。',
      '如蒙支持，感激不尽。',
      '老兄，这次帮帮忙，投个支持？',
    ],
    unpredictable: [
      '相信我，支持就对了。……大概吧。',
      '我掐指一算，你今天该投支持。',
      '直觉告诉我，支持是最好的选择。也可能是最坏的。',
    ],
  },
  oppose: {
    aggressive: [
      '这件事你必须反对，没有商量的余地。',
      '投反对，否则你的席位我不保证安全。',
      '别跟我作对，投票反对对你有好处。',
    ],
    moderate: [
      '这个法案有隐患，建议你投反对。',
      '我算过了，反对比支持划算，信我一次。',
      '出于大局考虑，建议你反对此案。',
    ],
    defensive: [
      '此案若过，后患无穷。谨请你反对。',
      '为保安全，请反对此法案。',
      '根据我的判断，反对更为稳妥。',
    ],
    unpredictable: [
      '天机不可泄露，但你该投反对。',
      '反对。理由？不需要理由。',
      '我做了个梦，梦里的你投了反对。',
    ],
  },
};

// 消息模板
function pickMessage(stance, category) {
  const pool = MESSAGES[stance][category] || MESSAGES[stance].moderate;
  return pool[Math.floor(Math.random() * pool.length)];
}

// 承诺信息
export function getBargainChance(category) {
  switch (category) {
    case 'aggressive': return 0.75;
    case 'moderate': return 0.50;
    case 'defensive': return 0.30;
    case 'unpredictable': return 0.20 + Math.random() * 0.6; // 20-80%
    default: return 0.40;
  }
}

// 生成本轮所有 AI 发来的消息
export function generateBargains() {
  if (!gameState._pendingBargains) gameState._pendingBargains = [];
  gameState._pendingBargains = [];

  const playerId = gameState.playerFactionId;
  for (const [fid, faction] of Object.entries(gameState.factions)) {
    if (fid === playerId || !faction.isPlayerControllable) continue;
    if (fid === 'npcCongress' || fid === 'npcCppcc') continue;

    const strategy = gameState.aiStrategies[fid];
    if (!strategy) continue;

    const chance = getBargainChance(strategy.category);
    if (Math.random() > chance) continue;

    // 决定 AI 希望玩家投什么
    // 激进型倾向要求反对，保守型倾向要求支持
    let preferStance;
    if (strategy.category === 'aggressive') {
      preferStance = Math.random() < 0.7 ? 'oppose' : 'support';
    } else if (strategy.category === 'defensive') {
      preferStance = Math.random() < 0.7 ? 'support' : 'oppose';
    } else if (strategy.category === 'unpredictable') {
      preferStance = Math.random() < 0.5 ? 'support' : 'oppose';
    } else {
      // moderate: 50/50
      preferStance = Math.random() < 0.5 ? 'support' : 'oppose';
    }

    const message = pickMessage(preferStance, strategy.category);
    const leaderName = faction.leaderName || '某领袖';
    const factionLabel = `${leaderName} · ${strategy.name}`;

    gameState._pendingBargains.push({
      factionId: fid,
      leaderName,
      strategyName: strategy.name,
      displayName: factionLabel,
      category: strategy.category,
      message,
      preferStance,
      resolved: false,
    });
  }

  // 打乱顺序
  gameState._pendingBargains.sort(() => Math.random() - 0.5);
  return gameState._pendingBargains;
}

// 玩家回应
export function resolveBargain(factionId, accepted) {
  if (!gameState._pendingBargains) return;
  const bargain = gameState._pendingBargains.find(b => b.factionId === factionId);
  if (!bargain) return;

  bargain.resolved = true;
  bargain.accepted = accepted;

  // 存入承诺池（下轮法案生效）
  if (!gameState._activeAgreements) gameState._activeAgreements = [];
  gameState._activeAgreements.push({
    factionId,
    accepted,
    preferStance: bargain.preferStance,
    strategyName: bargain.strategyName,
    category: bargain.category,
    roundsLeft: 1, // 仅下轮生效
  });
}

// 检查是否还有未回复的消息
export function hasPendingBargains() {
  return gameState._pendingBargains?.some(b => !b.resolved) || false;
}

export function getNextPendingBargain() {
  return gameState._pendingBargains?.find(b => !b.resolved) || null;
}

// AI 投票时检查是否有承诺需要履行
export function shouldHonorAgreement(factionId, myStance) {
  if (!gameState._activeAgreements) return null; // null = 不干涉
  const agreement = gameState._activeAgreements.find(a => a.factionId === factionId);
  if (!agreement) return null;

  // 15-35% 概率背叛（诡变型背叛率更高）
  let betrayChance = 0.2;
  if (agreement.category === 'unpredictable') betrayChance = 0.35;
  if (agreement.category === 'aggressive') betrayChance = 0.25;

  if (Math.random() < betrayChance) {
    return null; // 背叛，自由投票
  }

  // 履行承诺
  const followRate = 0.65 + Math.random() * 0.2; // 65-85%
  if (Math.random() < followRate) {
    if (agreement.accepted) {
      return agreement.preferStance; // 跟玩家保持一致的立场
    } else {
      // 拒绝 → 投相反的
      return agreement.preferStance === 'support' ? 'oppose' : 'support';
    }
  }
  return null; // 小概率不按承诺走
}

// 回合结束后清理失效承诺
export function expireAgreements() {
  if (!gameState._activeAgreements) return;
  gameState._activeAgreements = gameState._activeAgreements.filter(a => {
    a.roundsLeft--;
    return a.roundsLeft > 0;
  });
}

// 获取承诺履行日志
export function getAgreementLog(factionId, actualStance, honored) {
  const agreement = gameState._activeAgreements?.find(a => a.factionId === factionId);
  if (!agreement) return null;
  const name = agreement.strategyName || factionId;
  if (honored) {
    return `${name} 履行了承诺`;
  } else {
    return `${name} 背弃了承诺`;
  }
}
