// 厚积薄发 — 保守发育型（适合组织部）
export default {
  name: '厚积薄发',
  category: 'defensive',
  description: '资源积累者。前期蛰伏攒资源，后期厚积薄发一举反超。',
  bias: { organization: 60, discipline: 10, publicSecurity: 5 },

  weights: {
    visitSeat:       10,
    completeTask:    18,
    scoutSeat:       3,
    stealSeat:       0,
    investigate:     2,
    interrogate:     1,
    raid:            0,
    positivePropaganda: 10,
    negativePropaganda: 0,
    fiveYearPlan:    10,
    projectBid:      8,
    sasacCash:       5,
    appointOfficial:         12,
    boostLoyaltyInfluence:    12,
    merchant:        6,
  },

  rules: {
    attackPlayerThreshold: 99,       // 几乎从不攻击
    attackMultiplier: 0.5,
    focusOnEconomy: true,            // 优先资源建设
    appointBeforeVisit: true,        // 先任命再攻略
    neverUse: ['stealSeat', 'raid'],
    boostLoyaltyAggressively: true,   // 忠诚度维护
  }
};
