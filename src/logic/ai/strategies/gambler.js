// 孤注一掷 — 诡变投机型
export default {
  name: '孤注一掷',
  category: 'unpredictable',
  description: '赌徒。要么大赢要么大输，最爱高风险高回报的举动。',
  bias: { publicSecurity: 35, discipline: 25, organization: 10 },

  weights: {
    visitSeat:       3,
    completeTask:    4,
    scoutSeat:       5,
    stealSeat:       25,
    investigate:     8,
    interrogate:     12,
    raid:            18,
    positivePropaganda: 2,
    negativePropaganda: 8,
    fiveYearPlan:    3,
    projectBid:      6,
    sasacCash:       4,
    appointOfficial:         0,
    boostLoyaltyInfluence:    2,
    merchant:        0,
  },

  rules: {
    attackPlayerThreshold: 0,        // 随时可能攻击
    attackMultiplier: 3.0,
    chaosFactor: 0.4,               // 40%概率随机行动
    neverUse: ['appointOfficial', 'merchant'],
    allOrNothing: true,              // 资源不足也硬上
  }
};
