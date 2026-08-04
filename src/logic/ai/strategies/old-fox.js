// 老成持重 — 稳健均衡型（适合组织部）
export default {
  name: '老成持重',
  category: 'moderate',
  description: '深谋远虑的老手。攻守兼备，随机应变，不做无准备之事。',
  bias: { organization: 50, discipline: 20, publicSecurity: 10 },

  weights: {
    visitSeat:       12,
    completeTask:    15,
    scoutSeat:       8,
    stealSeat:       5,
    investigate:     8,
    interrogate:     5,
    raid:            3,
    positivePropaganda: 6,
    negativePropaganda: 4,
    fiveYearPlan:    8,
    projectBid:      5,
    sasacCash:       3,
    appointOfficial:         10,
    boostLoyaltyInfluence:    6,
    merchant:        2,
  },

  rules: {
    attackPlayerThreshold: 8,
    attackMultiplier: 1.3,
    completeOwnTasksFirst: true,    // 先做完自己的任务
    preferAppointOverMerchant: true, // 重用任而非商人
  }
};
