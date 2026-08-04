// 疯狂掠夺 — 激进攻击型（适合公安厅）
export default {
  name: '疯狂掠夺',
  category: 'aggressive',
  description: '席位的掠夺者。疯狂抢夺、突击检查，用武力碾压一切。',
  bias: { publicSecurity: 60, discipline: 25, organization: 5 },

  weights: {
    visitSeat:       4,
    completeTask:    6,
    scoutSeat:       8,
    stealSeat:       28,
    investigate:     5,
    interrogate:     18,
    raid:            20,
    positivePropaganda: 0,
    negativePropaganda: 4,
    projectBid:      2,
    fiveYearPlan:    0,
    sasacCash:       0,
    appointOfficial:         0,
    boostLoyaltyInfluence:    2,
    merchant:        0,
  },

  rules: {
    attackPlayerThreshold: 5,
    attackMultiplier: 2.0,
    neverUse: ['positivePropaganda', 'fiveYearPlan', 'sasacCash', 'appointOfficial', 'merchant'],
    prioritizeSteal: true,           // 能抢就抢
    preferTarget: 'playerFirst',     // 优先抢玩家的
  }
};
