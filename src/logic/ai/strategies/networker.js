// 人脉经营 — 稳健均衡型（任何领袖）
export default {
  name: '人脉经营',
  category: 'moderate',
  description: '交际高手。靠人脉和金钱铺路，重结交轻冲突。',
  bias: { organization: 40, discipline: 20, publicSecurity: 15 },

  weights: {
    visitSeat:       8,
    completeTask:    10,
    scoutSeat:       5,
    stealSeat:       2,
    investigate:     3,
    interrogate:     2,
    raid:            1,
    positivePropaganda: 12,
    negativePropaganda: 3,
    fiveYearPlan:    5,
    projectBid:      8,
    sasacCash:       6,
    appointOfficial:         15,
    boostLoyaltyInfluence:    10,
    merchant:        10,
  },

  rules: {
    attackPlayerThreshold: 10,
    attackMultiplier: 1.0,
    preferMerchant: true,            // 爱用商人上门
    boostWhenLoyaltyBelow: 5,        // 忠诚 < 5 时提升
    avoidInvestigate: true,          // 尽量不查人（得罪人）
  }
};
