// src/logic/ai/strategy-loader.js
import ironFist from './strategies/iron-fist.js';
import madRaider from './strategies/mad-raider.js';
import oldFox from './strategies/old-fox.js';
import networker from './strategies/networker.js';
import builder from './strategies/builder.js';
import survivor from './strategies/survivor.js';
import gambler from './strategies/gambler.js';
import smilingDagger from './strategies/smiling-dagger.js';

const ALL_STRATEGIES = [
  ironFist, madRaider, oldFox, networker,
  builder, survivor, gambler, smilingDagger
];

// 领袖对各类策略的偏好权重
const LEADER_BIAS = {
  discipline:      { aggressive: 70, moderate: 20, defensive: 5, unpredictable: 5 },
  publicSecurity:  { aggressive: 60, moderate: 25, defensive: 5, unpredictable: 10 },
  organization:    { aggressive: 10, moderate: 50, defensive: 35, unpredictable: 5 },
};

function weightedRandom(items, weightFn) {
  const total = items.reduce((s, i) => s + weightFn(i), 0);
  let r = Math.random() * total;
  for (const item of items) {
    r -= weightFn(item);
    if (r <= 0) return item;
  }
  return items[items.length - 1];
}

export function assignStrategies() {
  const assigned = {};

  for (const [factionId, biases] of Object.entries(LEADER_BIAS)) {
    // 先按类别选分类
    const categories = Object.entries(biases).map(([cat, weight]) => ({ cat, weight }));
    const category = weightedRandom(categories, c => c.weight).cat;

    // 从该类别中选具体策略
    const pool = ALL_STRATEGIES.filter(s => s.category === category);
    // 避免重复：优先选未被分配的
    const unused = pool.filter(s => !Object.values(assigned).some(a => a.name === s.name));
    const candidates = unused.length > 0 ? unused : pool;

    // 用领袖偏好细调：策略的 bias 字段加权
    const pick = weightedRandom(candidates, s => {
      const leaderWeight = (s.bias[factionId] || 10);
      return Math.max(1, leaderWeight);
    });

    assigned[factionId] = { ...pick }; // 深拷贝
  }

  return assigned;
}
