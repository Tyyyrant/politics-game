// 铁腕镇压 — 激进攻击型（适合纪委）
export default {
  name: '铁腕镇压',
  category: 'aggressive',
  description: '冷酷执法者。用查处和审讯开路，先打垮对手再谈发展。',
  bias: { discipline: 70, publicSecurity: 30, organization: 5 },

  weights: {
    visitSeat:       3,
    completeTask:    5,
    scoutSeat:       6,
    stealSeat:       10,
    investigate:     30,
    interrogate:     22,
    raid:            15,
    positivePropaganda: 0,
    negativePropaganda: 6,
    projectBid:      0,
    fiveYearPlan:    0,
    sasacCash:       0,
    appointOfficial:         0,
    boostLoyaltyInfluence:    0,
    merchant:        0,
  },

  rules: {
    attackPlayerThreshold: 6,        // 玩家席位 > N 时全攻模式
    attackMultiplier: 2.5,           // 攻击玩家时分数倍率
    neverUse: ['positivePropaganda', 'boostLoyaltyInfluence', 'merchant', 'appointOfficial', 'fiveYearPlan', 'sasacCash', 'projectBid'],
    preferInvestigateRank: 'highest', // 优先查级别最高的
    instantInvestigate: true,        // 有纪委标记就查
  }
};
