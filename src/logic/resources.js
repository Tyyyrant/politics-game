// src/logic/resources.js
import { gameState, emit } from './state.js';
import { RANK_RESOURCES, RANK_INFLUENCE } from './data/constants.js';

export function produceResources(factionId) {
  const faction = gameState.factions[factionId];
  if (!faction) return;
  for (const member of faction.members) {
    if (member.investigationStatus === 'evidence') continue;
    const val = RANK_RESOURCES[member.rank] || 0;
    faction.resources[member.dept] = (faction.resources[member.dept] || 0) + val;
  }
  const leaderVal = RANK_RESOURCES[faction.leaderRank] || 0;
  faction.resources[faction.leaderDept] = (faction.resources[faction.leaderDept] || 0) + leaderVal;
  // TEST: give propaganda faction tons of resources and funds for testing
  if (factionId === 'propaganda') {
    faction.influence += 50;
    faction.funds += 20;
    faction.genericResources = (faction.genericResources || 0) + 20;
    faction.disciplineMarks += 5;
  }
  emit('resources:produced', { factionId });
}

export function spendResources(factionId, dept, amount) {
  const faction = gameState.factions[factionId];
  const deptRes = faction.resources[dept] || 0;
  const genRes = faction.genericResources || 0;
  if (deptRes + genRes < amount) return false;
  // Spend specific resources first, then generic
  const fromDept = Math.min(deptRes, amount);
  const fromGen = amount - fromDept;
  faction.resources[dept] = deptRes - fromDept;
  faction.genericResources = genRes - fromGen;
  emit('resources:spent', { factionId, dept, amount, genericUsed: fromGen });
  return true;
}

export function spendAnyResources(factionId, amount) {
  const faction = gameState.factions[factionId];
  // Try generic resources first
  if (faction.genericResources > 0) {
    const take = Math.min(faction.genericResources, amount);
    faction.genericResources -= take;
    amount -= take;
  }
  if (amount <= 0) return true;
  const entries = Object.entries(faction.resources).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  let remaining = amount;
  for (const [dept, val] of entries) {
    if (remaining <= 0) break;
    const take = Math.min(val, remaining);
    faction.resources[dept] -= take;
    remaining -= take;
  }
  return remaining <= 0;
}

export function produceInfluence(factionId) {
  const faction = gameState.factions[factionId];
  let inf = 0;
  for (const m of faction.members) {
    if (m.investigationStatus === 'evidence') continue;
    inf += RANK_INFLUENCE[m.rank] || 0;
  }
  inf += RANK_INFLUENCE[faction.leaderRank] || 0;
  faction.influence += inf;
  emit('influence:produced', { factionId, amount: inf });
}

export function spendInfluence(factionId, amount) {
  const faction = gameState.factions[factionId];
  if (faction.influence < amount) return false;
  faction.influence -= amount;
  return true;
}
