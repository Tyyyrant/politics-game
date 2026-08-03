// src/logic/data/factions.js
import { TRAITS } from './constants.js';
const T = TRAITS;

export const FACTION_DEFS = {
  propaganda: {
    id: 'propaganda', leader: { name: '刘泰来', title: '省委常委、宣传部部长', dept: 'propaganda', rank: '副部', isPlayerControllable: true },
    members: [
      { name: '王卫东', dept: 'publicSecurity', position: '公安厅副厅长', rank: '副厅', loyalty: 8, traits: [T.trustedAide, T.mentored, T.alumni] },
      { name: '李宁远', dept: 'govOffice', position: '秘书一处处长', rank: '正处', loyalty: 8, traits: [T.trustedAide, T.mentored, T.alumni] },
      { name: '罗诚', dept: 'education', position: '一处处长', rank: '正处', loyalty: 8, traits: [T.trustedAide, T.mentored, T.arrangedJob] },
      { name: '曹志明', dept: 'finance', position: '一处副处长', rank: '副处', loyalty: 6, traits: [T.mentored, T.alumni] },
      { name: '马建军', dept: 'discipline', position: '二处处长', rank: '正处', loyalty: 7, traits: [T.mentored, T.childSchool] },
      { name: '杨帆', dept: 'organization', position: '一处副处长', rank: '副处', loyalty: 6, traits: [T.mentored, T.politicalAmbition] },
      { name: '李炜', dept: 'propaganda', position: '宣传处处长', rank: '正处', loyalty: 6, traits: [T.mentored, T.politicalAmbition, T.seekPatron] }
    ]
  },
  discipline: {
    id: 'discipline', leader: { name: '陈汉生', title: '省委常委、省纪委书记', dept: 'discipline', rank: '副部', isPlayerControllable: true },
    members: [
      { name: '赵志刚', dept: 'ndrc', position: '发改委副主任', rank: '副厅', loyalty: 8, traits: [T.sharedInterest] },
      { name: '赵毅', dept: 'publicSecurity', position: '公安厅副厅长', rank: '副厅', loyalty: 8, traits: [T.mentored] },
      { name: '赵建峰', dept: 'housing', position: '住建厅副厅长', rank: '副厅', loyalty: 7, traits: [T.arrangedJob] },
      { name: '白洁', dept: 'discipline', position: '一处处长', rank: '正处', loyalty: 8, traits: [T.trustedAide, T.sharedInterest] },
      { name: '陈敏', dept: 'hrss', position: '一处副处长', rank: '副处', loyalty: 6, traits: [T.mentored, T.seekPatron] },
      { name: '邓超', dept: 'legalAffairs', position: '综治处处长', rank: '正处', loyalty: 7, traits: [T.mentored, T.politicalAmbition] },
      { name: '鄂婷', dept: 'congress', position: '一处副处长', rank: '副处', loyalty: 5, traits: [T.alumni, T.arrangedJob] },
      { name: '冯涛', dept: 'audit', position: '一处处长', rank: '正处', loyalty: 7, traits: [T.mentored, T.buyHouse] }
    ]
  },
  organization: {
    id: 'organization', leader: { name: '米景文', title: '省委常委、组织部部长', dept: 'organization', rank: '副部', isPlayerControllable: true },
    members: [
      { name: '欧阳正', dept: 'organization', position: '组织部副部长', rank: '副厅', loyalty: 9, traits: [T.trustedAide, T.sharedInterest, T.mentored] },
      { name: '苏宁', dept: 'hrss', position: '人社厅副厅长', rank: '副厅', loyalty: 7, traits: [T.mentored, T.politicalAmbition] },
      { name: '苏敏', dept: 'education', position: '教育厅副厅长', rank: '副厅', loyalty: 7, traits: [T.mentored, T.alumni] },
      { name: '郭强', dept: 'finance', position: '二处处长', rank: '正处', loyalty: 7, traits: [T.mentored, T.childSchool] },
      { name: '韩华', dept: 'govOffice', position: '办公厅副主任', rank: '副厅', loyalty: 6, traits: [T.mentored, T.seekPatron] },
      { name: '蒋平', dept: 'housing', position: '一处处长', rank: '正处', loyalty: 6, traits: [T.mentored, T.buyHouse] },
      { name: '沈文', dept: 'ndrc', position: '规划处处长', rank: '正处', loyalty: 6, traits: [T.mentored, T.politicalAmbition] },
      { name: '何庆', dept: 'partySchool', position: '党校副校长', rank: '副厅', loyalty: 8, traits: [T.trustedAide, T.alumni] }
    ]
  },
  publicSecurity: {
    id: 'publicSecurity', leader: { name: '万长林', title: '省委常委、公安厅厅长', dept: 'publicSecurity', rank: '副部', isPlayerControllable: true },
    members: [
      { name: '潘海龙', dept: 'publicSecurity', position: '公安厅副厅长', rank: '副厅', loyalty: 9, traits: [T.trustedAide, T.sharedInterest, T.mentored] },
      { name: '潘云飞', dept: 'legalAffairs', position: '政法委副书记', rank: '正厅', loyalty: 8, traits: [T.trustedAide, T.mentored] },
      { name: '黄志强', dept: 'publicSecurity', position: '一处处长', rank: '正处', loyalty: 8, traits: [T.trustedAide, T.alumni] },
      { name: '朱俊', dept: 'discipline', position: '三处处长', rank: '正处', loyalty: 6, traits: [T.mentored, T.politicalAmbition] },
      { name: '秦风', dept: 'govOffice', position: '行政处处长', rank: '正处', loyalty: 6, traits: [T.mentored, T.arrangedJob] },
      { name: '许豪', dept: 'finance', position: '三处处长', rank: '正处', loyalty: 6, traits: [T.sharedInterest, T.buyHouse] },
      { name: '何勇', dept: 'procuratorate', position: '副检察长', rank: '副厅', loyalty: 7, traits: [T.mentored, T.alumni] }
    ]
  },
  npcCongress: {
    id: 'npcCongress', leader: { name: '任重远', title: '省人大主任', dept: 'congress', rank: '正厅', isPlayerControllable: false, initialSeats: 2 },
    members: [
      { name: '任远', dept: 'congress', position: '人大副主任', rank: '副厅', loyalty: 7, traits: [] },
      { name: '魏平', dept: 'congress', position: '法制处处长', rank: '正处', loyalty: 6, traits: [] },
      { name: '陶然', dept: 'govOffice', position: '办公厅副主任', rank: '副厅', loyalty: 5, traits: [] },
      { name: '姜文', dept: 'education', position: '二处处长', rank: '正处', loyalty: 6, traits: [] }
    ]
  },
  npcCppcc: {
    id: 'npcCppcc', leader: { name: '郑国华', title: '省政协主席', dept: 'cppcc', rank: '正厅', isPlayerControllable: false, initialInfluence: 3 },
    members: [
      { name: '郑明', dept: 'cppcc', position: '政协副主席', rank: '副厅', loyalty: 6, traits: [] },
      { name: '谢安', dept: 'sasac', position: '国资委副主任', rank: '副厅', loyalty: 5, traits: [] },
      { name: '邹平', dept: 'ndrc', position: '发改委副主任', rank: '副厅', loyalty: 5, traits: [] }
    ]
  }
};

export function createInitialFactionState(factionId) {
  const def = FACTION_DEFS[factionId];
  if (!def) throw new Error(`Unknown faction: ${factionId}`);
  const memberIdPrefix = { propaganda: '刘', discipline: '陈', organization: '米', publicSecurity: '万', npcCongress: '任', npcCppcc: '郑' };
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
    resources: {}, genericResources: 0, influence: 0, funds: 0, briberyMarks: [], disciplineMarks: 0,
    lockedSeats: def.leader.initialSeats || 0, activeSeatTasks: [],
    fiveYearPlanCooldown: 0, projectBidUsed: false, interrogateUsed: 0, raidUsed: false, projectVetoUsed: false,
    visitsThisTurn: 0  // 每轮最多拜访3个席位
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

// 派系首领头像
export const FACTION_PORTRAITS = {
  propaganda: 'portraits/liu.png',
  discipline: 'portraits/chen.png',
  organization: 'portraits/mi.png',
  publicSecurity: 'portraits/wan.png'
};

// 成员头像映射（改名后保持原头像）
const _portraitOriginals = {};
export function rememberPortraitOrigin(newName, originalName) {
  _portraitOriginals[newName] = originalName;
}
export function getOriginalName(currentName) {
  let name = currentName;
  while (_portraitOriginals[name]) name = _portraitOriginals[name];
  return name;
}
export function getMemberPortrait(memberName) {
  try {
    const lookup = getOriginalName(memberName);
    return `portraits/${lookup}.png`;
  } catch (_) { return null; }
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
