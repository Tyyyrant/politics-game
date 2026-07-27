// src/logic/data/factions.js
import { TRAITS } from './constants.js';
const T = TRAITS;

export const FACTION_DEFS = {
  propaganda: {
    id: 'propaganda', leader: { name: 'J', title: '省委常委、宣传部部长', dept: 'propaganda', rank: '副部', isPlayerControllable: true },
    members: [
      { name: 'W', dept: 'publicSecurity', position: '公安厅副厅长', rank: '副厅', loyalty: 8, traits: [T.trustedAide, T.mentored, T.alumni] },
      { name: 'Ln', dept: 'govOffice', position: '秘书一处处长', rank: '正处', loyalty: 8, traits: [T.trustedAide, T.mentored, T.alumni] },
      { name: 'Lo', dept: 'education', position: '一处处长', rank: '正处', loyalty: 8, traits: [T.trustedAide, T.mentored, T.arrangedJob] },
      { name: 'Ca', dept: 'finance', position: '一处副处长', rank: '副处', loyalty: 6, traits: [T.mentored, T.alumni] },
      { name: 'M', dept: 'discipline', position: '二处处长', rank: '正处', loyalty: 7, traits: [T.mentored, T.childSchool] },
      { name: 'Y', dept: 'organization', position: '一处副处长', rank: '副处', loyalty: 6, traits: [T.mentored, T.politicalAmbition] },
      { name: 'Li', dept: 'propaganda', position: '宣传处处长', rank: '正处', loyalty: 6, traits: [T.mentored, T.politicalAmbition, T.seekPatron] }
    ]
  },
  discipline: {
    id: 'discipline', leader: { name: 'Ch', title: '省委常委、省纪委书记', dept: 'discipline', rank: '副部', isPlayerControllable: true },
    members: [
      { name: 'Z1', dept: 'ndrc', position: '发改委副主任', rank: '副厅', loyalty: 8, traits: [T.sharedInterest] },
      { name: 'Z2', dept: 'publicSecurity', position: '公安厅副厅长', rank: '副厅', loyalty: 8, traits: [T.mentored] },
      { name: 'Z3', dept: 'housing', position: '住建厅副厅长', rank: '副厅', loyalty: 7, traits: [T.arrangedJob] },
      { name: 'B', dept: 'discipline', position: '一处处长', rank: '正处', loyalty: 8, traits: [T.trustedAide, T.sharedInterest] },
      { name: 'C', dept: 'hrss', position: '一处副处长', rank: '副处', loyalty: 6, traits: [T.mentored, T.seekPatron] },
      { name: 'D', dept: 'legalAffairs', position: '综治处处长', rank: '正处', loyalty: 7, traits: [T.mentored, T.politicalAmbition] },
      { name: 'E', dept: 'congress', position: '一处副处长', rank: '副处', loyalty: 5, traits: [T.alumni, T.arrangedJob] },
      { name: 'F', dept: 'audit', position: '一处处长', rank: '正处', loyalty: 7, traits: [T.mentored, T.buyHouse] }
    ]
  },
  organization: {
    id: 'organization', leader: { name: 'MI', title: '省委常委、组织部部长', dept: 'organization', rank: '副部', isPlayerControllable: true },
    members: [
      { name: 'O1', dept: 'organization', position: '组织部副部长', rank: '正厅', loyalty: 9, traits: [T.trustedAide, T.sharedInterest, T.mentored] },
      { name: 'O2', dept: 'hrss', position: '人社厅副厅长', rank: '副厅', loyalty: 7, traits: [T.mentored, T.politicalAmbition] },
      { name: 'O3', dept: 'education', position: '教育厅副厅长', rank: '副厅', loyalty: 7, traits: [T.mentored, T.alumni] },
      { name: 'O4', dept: 'finance', position: '二处处长', rank: '正处', loyalty: 7, traits: [T.mentored, T.childSchool] },
      { name: 'O5', dept: 'govOffice', position: '办公厅副主任', rank: '副厅', loyalty: 6, traits: [T.mentored, T.seekPatron] },
      { name: 'O6', dept: 'housing', position: '一处处长', rank: '正处', loyalty: 6, traits: [T.mentored, T.buyHouse] },
      { name: 'O7', dept: 'ndrc', position: '规划处处长', rank: '正处', loyalty: 6, traits: [T.mentored, T.politicalAmbition] },
      { name: 'O8', dept: 'partySchool', position: '党校副校长', rank: '副厅', loyalty: 8, traits: [T.trustedAide, T.alumni] }
    ]
  },
  publicSecurity: {
    id: 'publicSecurity', leader: { name: 'Wa', title: '省委常委、公安厅厅长', dept: 'publicSecurity', rank: '副部', isPlayerControllable: true },
    members: [
      { name: 'P1', dept: 'publicSecurity', position: '公安厅副厅长', rank: '副厅', loyalty: 9, traits: [T.trustedAide, T.sharedInterest, T.mentored] },
      { name: 'P2', dept: 'legalAffairs', position: '政法委副书记', rank: '正厅', loyalty: 8, traits: [T.trustedAide, T.mentored] },
      { name: 'P3', dept: 'publicSecurity', position: '一处处长', rank: '正处', loyalty: 8, traits: [T.trustedAide, T.alumni] },
      { name: 'P4', dept: 'discipline', position: '三处处长', rank: '正处', loyalty: 6, traits: [T.mentored, T.politicalAmbition] },
      { name: 'P5', dept: 'govOffice', position: '行政处处长', rank: '正处', loyalty: 6, traits: [T.mentored, T.arrangedJob] },
      { name: 'P6', dept: 'finance', position: '三处处长', rank: '正处', loyalty: 6, traits: [T.sharedInterest, T.buyHouse] },
      { name: 'P7', dept: 'procuratorate', position: '副检察长', rank: '副厅', loyalty: 7, traits: [T.mentored, T.alumni] }
    ]
  },
  npcCongress: {
    id: 'npcCongress', leader: { name: 'RD', title: '省人大主任', dept: 'congress', rank: '正厅', isPlayerControllable: false, initialSeats: 2 },
    members: [
      { name: 'R1', dept: 'congress', position: '人大副主任', rank: '副厅', loyalty: 7, traits: [] },
      { name: 'R2', dept: 'congress', position: '法制处处长', rank: '正处', loyalty: 6, traits: [] },
      { name: 'R3', dept: 'govOffice', position: '办公厅副主任', rank: '副厅', loyalty: 5, traits: [] },
      { name: 'R4', dept: 'education', position: '二处处长', rank: '正处', loyalty: 6, traits: [] }
    ]
  },
  npcCppcc: {
    id: 'npcCppcc', leader: { name: 'ZX', title: '省政协主席', dept: 'cppcc', rank: '正厅', isPlayerControllable: false, initialInfluence: 3 },
    members: [
      { name: 'Z1', dept: 'cppcc', position: '政协副主席', rank: '副厅', loyalty: 6, traits: [] },
      { name: 'Z2', dept: 'sasac', position: '国资委副主任', rank: '副厅', loyalty: 5, traits: [] },
      { name: 'Z3', dept: 'ndrc', position: '发改委副主任', rank: '副厅', loyalty: 5, traits: [] }
    ]
  }
};

export function createInitialFactionState(factionId) {
  const def = FACTION_DEFS[factionId];
  if (!def) throw new Error(`Unknown faction: ${factionId}`);
  const memberIdPrefix = { propaganda: 'J', discipline: 'Ch', organization: 'MI', publicSecurity: 'Wa', npcCongress: 'RD', npcCppcc: 'ZX' };
  const members = def.members.map((m, i) => ({
    id: `${memberIdPrefix[factionId] || factionId}_${m.name}`, name: m.name, dept: m.dept, position: m.position, rank: m.rank,
    loyalty: m.loyalty, maxLoyalty: 9, traits: [...m.traits], isUnderInvestigation: false,
    investigationStatus: null, investigationRoundsLeft: 0,
    personalQuests: m.traits.filter(t => [T.childSchool, T.buyHouse, T.politicalAmbition, T.seekPatron, T.arrangedJob].includes(t)),
    completedQuests: []
  }));
  return {
    id: factionId, leaderName: def.leader.name, leaderTitle: def.leader.title,
    leaderDept: def.leader.dept, leaderRank: def.leader.rank,
    isPlayerControllable: def.leader.isPlayerControllable, members,
    resources: {}, influence: 0, funds: 0, briberyMarks: [], disciplineMarks: 0,
    lockedSeats: def.leader.initialSeats || 0, activeSeatTasks: [],
    fiveYearPlanCooldown: 0, projectBidUsed: false, interrogateUsed: 0, raidUsed: false, projectVetoUsed: false
  };
}

export function getFactionResources(factionState) {
  const resources = {};
  for (const member of factionState.members) {
    if (member.investigationStatus === 'evidence') continue;
    const val = { '副处': 1, '正处': 2, '副厅': 4, '正厅': 6, '副部': 10 }[member.rank] || 0;
    resources[member.dept] = (resources[member.dept] || 0) + val;
  }
  const leaderVal = { '副部': 10, '正厅': 6 }[factionState.leaderRank] || 0;
  resources[factionState.leaderDept] = (resources[factionState.leaderDept] || 0) + leaderVal;
  return resources;
}

export function getFactionInfluence(factionState) {
  let inf = 0;
  for (const member of factionState.members) {
    if (member.investigationStatus === 'evidence') continue;
    inf += { '副处': 1, '正处': 2, '副厅': 4, '正厅': 6, '副部': 10 }[member.rank] || 0;
  }
  inf += { '副部': 10, '正厅': 6 }[factionState.leaderRank] || 0;
  return inf;
}
