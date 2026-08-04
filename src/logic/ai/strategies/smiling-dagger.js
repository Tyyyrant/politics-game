// 笑里藏刀 — 诡变投机型
export default {
  name: '笑里藏刀',
  category: 'unpredictable',
  description: '伪善者。表面温和无害，暗中积蓄力量，时机一到突然反扑。',
  bias: { discipline: 30, organization: 25, publicSecurity: 20 },

  weights: {
    visitSeat:       10,
    completeTask:    12,
    scoutSeat:       10,
    stealSeat:       8,
    investigate:     6,
    interrogate:     3,
    raid:            2,
    positivePropaganda: 6,
    negativePropaganda: 5,
    fiveYearPlan:    6,
    projectBid:      5,
    sasacCash:       3,
    appointOfficial:         8,
    boostLoyaltyInfluence:    8,
    merchant:        8,
  },

  rules: {
    attackPlayerThreshold: 6,
    attackMultiplier: 2.5,
    fakePeaceful: true,              // 前期装作友好
    phaseTrigger: 8,                 // 第N轮后切换为攻击模式
    backstabWhenLeading: true,       // 自己领先时背刺玩家
  }
};
