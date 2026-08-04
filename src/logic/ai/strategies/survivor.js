// 明哲保身 — 保守防御型（适合任何领袖）
export default {
  name: '明哲保身',
  category: 'defensive',
  description: '守成者。不高调不惹事，守住自己的一亩三分地。',
  bias: { organization: 35, discipline: 25, publicSecurity: 20 },

  weights: {
    visitSeat:       8,
    completeTask:    20,
    scoutSeat:       8,
    stealSeat:       1,
    investigate:     3,
    interrogate:     2,
    raid:            1,
    positivePropaganda: 8,
    negativePropaganda: 1,
    fiveYearPlan:    5,
    projectBid:      6,
    sasacCash:       4,
    appointOfficial:         8,
    boostLoyaltyInfluence:    15,
    merchant:        4,
  },

  rules: {
    attackPlayerThreshold: 12,
    attackMultiplier: 0.3,
    neverUse: [],
    avoidIfAlone: true,             // 兵力不足时保守
    completeBeforeScout: true,       // 先完成再打探
  }
};
