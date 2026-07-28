// src/logic/loyalty.js
import { gameState, emit } from './state.js';
import { spendResources, spendInfluence } from './resources.js';
import { APPOINTMENT_COST, PROMOTION_INFLUENCE_COST, RECRUIT_INFLUENCE_COST, RECRUIT_RESOURCE_COST, TRAITS, DEPT_NAMES } from './data/constants.js';
import { DEPARTMENTS } from './data/departments.js';

export function boostLoyalty(factionId, memberId, method) {
  const faction = gameState.factions[factionId];
  const member = faction.members.find(m => m.id === memberId);
  if (!member) return { success: false, message: '成员不存在' };
  if (member.loyalty >= member.maxLoyalty) return { success: false, message: '忠诚度已满' };
  if (method === 'influence') { if (!spendInfluence(factionId, 10)) return { success: false, message: '影响力不足（需10）' }; }
  else if (method === 'funds') { if (faction.funds < 1) return { success: false, message: '资金不足（需1笔）' }; faction.funds--; }
  else return { success: false, message: '无效方式' };
  member.loyalty++;
  emit('loyalty:changed', { factionId, memberId, newLoyalty: member.loyalty });
  return { success: true, message: `${member.name}忠诚度+1（当前${member.loyalty}）` };
}

export function completePersonalQuest(factionId, memberId) {
  const faction = gameState.factions[factionId];
  const member = faction.members.find(m => m.id === memberId);
  if (!member || member.personalQuests.length === 0) return { success: false, message: '无待完成个人追求' };
  const quest = member.personalQuests[0];
  let cost = 0, dept = null, gain = 0;
  switch (quest) {
    case TRAITS.childSchool: cost = 1; dept = 'education'; gain = 2; break;
    case TRAITS.buyHouse: cost = 1; dept = 'housing'; gain = 3; break;
    case TRAITS.politicalAmbition: gain = member.rank === '副处' ? 2 : 3; return promoteMember(factionId, memberId);
    case TRAITS.arrangedJob: cost = 1; dept = 'sasac'; gain = 1; break;
    default: return { success: false, message: '未知任务' };
  }
  if (dept && !spendResources(factionId, dept, cost)) return { success: false, message: '资源不足' };
  member.loyalty = Math.min(member.maxLoyalty, member.loyalty + gain);
  member.personalQuests.shift(); member.completedQuests.push(quest);
  return { success: true, message: `${member.name}完成个人追求，忠诚度+${gain}` };
}

// 提拔本派系成员：消耗影响力 + 组织部资源
export function promoteMember(factionId, memberId) {
  const faction = gameState.factions[factionId];
  const member = faction.members.find(m => m.id === memberId);
  if (!member) return { success: false, message: '成员不存在' };

  const rankOrder = ['副处', '正处', '副厅', '正厅'];
  const idx = rankOrder.indexOf(member.rank);
  if (idx < 0 || idx >= rankOrder.length - 1) return { success: false, message: '无法继续提拔' };

  const newRank = rankOrder[idx + 1];
  const influenceCost = PROMOTION_INFLUENCE_COST[member.rank] || 5;
  const resourceCost = APPOINTMENT_COST[newRank] || 8;

  // Find a vacant position at the new rank in this department
  const dept = DEPARTMENTS[member.dept];
  if (!dept) return { success: false, message: '部门不存在' };
  const candidates = dept.positions.filter(p => p.rank === newRank);
  if (!candidates.length) return { success: false, message: `该部门没有${newRank}级职位` };

  let matchingPos = null;
  for (const pos of candidates) {
    const holders = faction.members.filter(m => m.dept === member.dept && m.position === pos.title && m.id !== member.id);
    if (holders.length < pos.count) { matchingPos = pos; break; }
  }
  if (!matchingPos) return { success: false, message: `${dept.name}的所有${newRank}职位已满` };

  // Spend resources
  if (!spendInfluence(factionId, influenceCost)) return { success: false, message: `影响力不足（需${influenceCost}点）` };
  if (!spendResources(factionId, 'organization', resourceCost) && !spendResources(factionId, member.dept, resourceCost)) {
    return { success: false, message: `组织部或本部门资源不足（需${resourceCost}）` };
  }

  // Perform promotion
  member.rank = newRank;
  member.position = matchingPos.title;
  member.loyalty = Math.min(member.maxLoyalty, member.loyalty + 2);
  gameState.roundLog.push({ factionId, action: 'promoteMember', target: `${member.name}→${newRank}·${matchingPos.title}`, result: '提拔成功' });
  emit('loyalty:changed', { factionId, memberId, newRank, newPosition: matchingPos.title });
  return { success: true, message: `${member.name}已晋升为${newRank}·${matchingPos.title}！消耗${influenceCost}影响力+${resourceCost}资源` };
}

// 招募无派系干部：消耗影响力 + 组织部资源，该干部获得"曾受你的提拔"特性
// targetRank: 目标职位级别  targetTitle: 具体职位名称（如"舆论处处长"，避免find取到同级别第一个）
export function recruitOfficial(factionId, officialName, officialDept, targetRank, targetTitle) {
  const faction = gameState.factions[factionId];
  const pool = gameState.independentOfficials;

  // Find the official in the independent pool (may be at a lower rank than target)
  const idx = pool.findIndex(o => o.name === officialName && o.dept === officialDept);
  if (idx < 0) return { success: false, message: '该干部已不在候选池中' };

  const official = pool[idx];
  const influenceCost = RECRUIT_INFLUENCE_COST[targetRank] || 5;
  const resourceCost = RECRUIT_RESOURCE_COST[targetRank] || 8;

  // Check vacancy for the specific target position
  const dept = DEPARTMENTS[officialDept];
  if (!dept) return { success: false, message: '部门不存在' };
  const matchingPos = dept.positions.find(p => p.title === targetTitle) || dept.positions.find(p => p.rank === targetRank);
  if (!matchingPos) return { success: false, message: `该部门没有${targetTitle || targetRank}职位` };

  const holders = faction.members.filter(m => m.dept === officialDept && m.position === matchingPos.title);
  if (holders.length >= matchingPos.count) return { success: false, message: `${dept.name}的${matchingPos.title}职位已满` };

  // Spend resources
  if (!spendInfluence(factionId, influenceCost)) return { success: false, message: `影响力不足（需${influenceCost}点）` };
  if (!spendResources(factionId, 'organization', resourceCost) && !spendResources(factionId, officialDept, resourceCost)) {
    return { success: false, message: `组织部或本部门资源不足（需${resourceCost}）` };
  }

  // Remove from pool and add to faction at target rank
  pool.splice(idx, 1);
  const memberId = `${factionId}_${official.name}`;
  const member = {
    id: memberId,
    name: official.name,
    dept: officialDept,
    position: matchingPos.title,
    rank: targetRank,  // Fill at target rank
    loyalty: 5,  // 受提拔之恩，初始忠诚
    maxLoyalty: 9,
    traits: [TRAITS.mentored],  // 曾受你的提拔
    isUnderInvestigation: false,
    investigationStatus: null,
    investigationRoundsLeft: 0,
    personalQuests: [],
    completedQuests: []
  };
  faction.members.push(member);
  gameState.roundLog.push({ factionId, action: 'recruitOfficial', target: `${official.name}→${targetRank}·${dept.name}·${matchingPos.title}`, result: '招募成功' });
  return { success: true, message: `成功招募${official.name}为${matchingPos.title}（${targetRank}）！消耗${influenceCost}影响力+${resourceCost}资源。获得"曾受你的提拔"特性，初始忠诚5` };
}

// 旧版任命（保留兼容，但新UI使用 recruitOfficial）
export function appointOfficial(factionId, dept, rank) {
  const faction = gameState.factions[factionId];
  // Try to recruit from independent pool first
  const pool = gameState.independentOfficials;
  const candidate = pool.find(o => o.dept === dept && o.rank === rank);
  if (candidate) {
    return recruitOfficial(factionId, candidate.name, candidate.dept, candidate.rank);
  }
  // Fallback: create a new official
  const cost = APPOINTMENT_COST[rank] || 5;
  const influenceCost = RECRUIT_INFLUENCE_COST[rank] || 5;
  if (!spendInfluence(factionId, influenceCost)) return { success: false, message: `影响力不足（需${influenceCost}点）` };
  if (!spendResources(factionId, 'organization', cost) && !spendResources(factionId, dept, cost)) return { success: false, message: '干部任用资源不足' };
  const deptData = DEPARTMENTS[dept];
  const matchingPos = deptData ? deptData.positions.find(p => p.rank === rank) : null;
  const posTitle = matchingPos ? matchingPos.title : `${DEPT_NAMES[dept] || dept}${rank}`;
  const member = { id: `${factionId}_新${faction.members.length + 1}`, name: `新干部${faction.members.length + 1}`, dept, position: posTitle, rank, loyalty: 5, maxLoyalty: 9, traits: [TRAITS.mentored], isUnderInvestigation: false, investigationStatus: null, investigationRoundsLeft: 0, personalQuests: [], completedQuests: [] };
  faction.members.push(member);
  return { success: true, message: `已任用一名${rank}级干部到${DEPT_NAMES[dept] || dept}（消耗${influenceCost}影响力+${cost}资源）` };
}

export function tryBribeMember(fromFactionId, toFactionId, memberId) {
  const targetFaction = gameState.factions[toFactionId];
  const member = targetFaction.members.find(m => m.id === memberId);
  if (!member) return { success: false, message: '目标不存在' };
  if (member.traits.includes('利益共同体')) return { success: false, message: '利益共同体无法收买' };
  const bribeCost = Math.max(1, Math.ceil((9 - member.loyalty) / 2));
  if (gameState.factions[fromFactionId].funds < bribeCost) return { success: false, message: `资金不足（需${bribeCost}笔）` };
  gameState.factions[fromFactionId].funds -= bribeCost; member.loyalty -= 2;
  if (member.loyalty <= 0) {
    targetFaction.members = targetFaction.members.filter(m => m.id !== memberId);
    member.loyalty = 4; member.traits = member.traits.filter(t => t !== '心腹嫡系' && t !== '利益共同体');
    member.id = `${fromFactionId}_${member.name}`;
    gameState.factions[fromFactionId].members.push(member);
    return { success: true, message: `良禽择木而栖，${member.name}已加入您的派系。` };
  }
  return { success: true, message: `${member.name}收下了您的资金，表示来日必当百倍奉还。` };
}
