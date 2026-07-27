// src/logic/loyalty.js
import { gameState, emit } from './state.js';
import { spendResources, spendInfluence } from './resources.js';
import { APPOINTMENT_COST, TRAITS, DEPT_NAMES } from './data/constants.js';

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

function promoteMember(factionId, memberId) {
  const faction = gameState.factions[factionId];
  const member = faction.members.find(m => m.id === memberId);
  const rankOrder = ['副处', '正处', '副厅', '正厅'];
  const idx = rankOrder.indexOf(member.rank);
  if (idx < 0 || idx >= rankOrder.length - 1) return { success: false, message: '无法继续提拔' };
  member.rank = rankOrder[idx + 1]; member.loyalty = Math.min(member.maxLoyalty, member.loyalty + 2);
  return { success: true, message: `${member.name}已晋升为${member.rank}` };
}

export function appointOfficial(factionId, dept, rank) {
  const faction = gameState.factions[factionId];
  const cost = APPOINTMENT_COST[rank] || 5;
  if (!spendResources(factionId, 'organization', cost) && !spendResources(factionId, dept, cost)) return { success: false, message: '干部任用资源不足' };
  const member = { id: `${factionId}_新${faction.members.length + 1}`, name: `新干部${faction.members.length + 1}`, dept, position: `${DEPT_NAMES[dept] || dept}${rank}`, rank, loyalty: 5, maxLoyalty: 9, traits: [], isUnderInvestigation: false, investigationStatus: null, investigationRoundsLeft: 0, personalQuests: [], completedQuests: [] };
  faction.members.push(member);
  return { success: true, message: `已任用一名${rank}级干部到${dept}` };
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
    return { success: true, message: `${member.name}已叛变到你的派系！` };
  }
  return { success: true, message: `${member.name}忠诚度-2（当前${member.loyalty}）` };
}
