// src/logic/data/departments.js
export const DEPARTMENTS = {
  govOffice: { id: 'govOffice', name: '政府办公厅', type: 'government', positions: [
    { title: '办公厅主任', rank: '正厅', count: 1 }, { title: '办公厅副主任', rank: '副厅', count: 2 },
    { title: '秘书一处处长', rank: '正处', count: 1 }, { title: '秘书二处处长', rank: '正处', count: 1 },
    { title: '行政处处长', rank: '正处', count: 1 }, { title: '档案处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  ndrc: { id: 'ndrc', name: '发改委', type: 'government', positions: [
    { title: '发改委主任', rank: '正厅', count: 1 }, { title: '发改委副主任', rank: '副厅', count: 2 },
    { title: '规划处处长', rank: '正处', count: 1 }, { title: '投资处处长', rank: '正处', count: 1 },
    { title: '产业处处长', rank: '正处', count: 1 }, { title: '审批处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  sasac: { id: 'sasac', name: '国资委', type: 'government', positions: [
    { title: '国资委主任', rank: '正厅', count: 1 }, { title: '国资委副主任', rank: '副厅', count: 2 },
    { title: '一处处长', rank: '正处', count: 1 }, { title: '二处处长', rank: '正处', count: 1 },
    { title: '三处处长', rank: '正处', count: 1 }, { title: '四处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  publicSecurity: { id: 'publicSecurity', name: '公安厅', type: 'government', positions: [
    { title: '公安厅长', rank: '副部', count: 1 }, { title: '公安厅副厅长', rank: '副厅', count: 2 },
    { title: '一处处长', rank: '正处', count: 1 }, { title: '二处处长', rank: '正处', count: 1 },
    { title: '三处处长', rank: '正处', count: 1 }, { title: '四处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  hrss: { id: 'hrss', name: '人社厅', type: 'government', positions: [
    { title: '人社厅厅长', rank: '正厅', count: 1 }, { title: '人社厅副厅长', rank: '副厅', count: 2 },
    { title: '一处处长', rank: '正处', count: 1 }, { title: '二处处长', rank: '正处', count: 1 },
    { title: '三处处长', rank: '正处', count: 1 }, { title: '四处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  finance: { id: 'finance', name: '财政厅', type: 'government', positions: [
    { title: '财政厅厅长', rank: '正厅', count: 1 }, { title: '财政厅副厅长', rank: '副厅', count: 2 },
    { title: '一处处长', rank: '正处', count: 1 }, { title: '二处处长', rank: '正处', count: 1 },
    { title: '三处处长', rank: '正处', count: 1 }, { title: '四处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  housing: { id: 'housing', name: '住建厅', type: 'government', positions: [
    { title: '住建厅厅长', rank: '正厅', count: 1 }, { title: '住建厅副厅长', rank: '副厅', count: 2 },
    { title: '一处处长', rank: '正处', count: 1 }, { title: '二处处长', rank: '正处', count: 1 },
    { title: '三处处长', rank: '正处', count: 1 }, { title: '四处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  education: { id: 'education', name: '教育厅', type: 'government', positions: [
    { title: '教育厅厅长', rank: '正厅', count: 1 }, { title: '教育厅副厅长', rank: '副厅', count: 2 },
    { title: '一处处长', rank: '正处', count: 1 }, { title: '二处处长', rank: '正处', count: 1 },
    { title: '三处处长', rank: '正处', count: 1 }, { title: '四处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  audit: { id: 'audit', name: '审计厅', type: 'government', positions: [
    { title: '审计厅厅长', rank: '正厅', count: 1 }, { title: '审计厅副厅长', rank: '副厅', count: 2 },
    { title: '一处处长', rank: '正处', count: 1 }, { title: '二处处长', rank: '正处', count: 1 },
    { title: '三处处长', rank: '正处', count: 1 }, { title: '四处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  partyOffice: { id: 'partyOffice', name: '党委办公厅', type: 'party', positions: [
    { title: '办公厅主任', rank: '副部', count: 1 }, { title: '办公厅副主任', rank: '副厅', count: 2 },
    { title: '综合处处长', rank: '正处', count: 1 }, { title: '会议处处长', rank: '正处', count: 1 },
    { title: '信息处处长', rank: '正处', count: 1 }, { title: '保密处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  organization: { id: 'organization', name: '组织部', type: 'party', positions: [
    { title: '组织部长', rank: '副部', count: 1 }, { title: '组织部副部长', rank: '副厅', count: 2 },
    { title: '干部处处长', rank: '正处', count: 1 }, { title: '考核处处长', rank: '正处', count: 1 },
    { title: '人才处处长', rank: '正处', count: 1 }, { title: '档案处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  propaganda: { id: 'propaganda', name: '宣传部', type: 'party', positions: [
    { title: '宣传部长', rank: '副部', count: 1 }, { title: '宣传部副部长', rank: '副厅', count: 2 },
    { title: '宣传处处长', rank: '正处', count: 1 }, { title: '舆论处处长', rank: '正处', count: 1 },
    { title: '文化处处长', rank: '正处', count: 1 }, { title: '出版处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  discipline: { id: 'discipline', name: '纪委', type: 'party', positions: [
    { title: '纪委书记', rank: '副部', count: 1 }, { title: '纪委副书记', rank: '正厅', count: 2 },
    { title: '一处处长', rank: '正处', count: 1 }, { title: '二处处长', rank: '正处', count: 1 },
    { title: '三处处长', rank: '正处', count: 1 }, { title: '四处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  legalAffairs: { id: 'legalAffairs', name: '政法委', type: 'party', positions: [
    { title: '政法委书记', rank: '副部', count: 1 }, { title: '政法委副书记', rank: '正厅', count: 2 },
    { title: '综治处处长', rank: '正处', count: 1 }, { title: '执法处处长', rank: '正处', count: 1 },
    { title: '维稳处处长', rank: '正处', count: 1 }, { title: '法治处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  partySchool: { id: 'partySchool', name: '党校', type: 'other', positions: [
    { title: '党校校长', rank: '正厅', count: 1 }, { title: '党校副校长', rank: '副厅', count: 2 },
    { title: '教务处处长', rank: '正处', count: 1 }, { title: '科研处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 }
  ]},
  congress: { id: 'congress', name: '人大', type: 'other', positions: [
    { title: '人大主任', rank: '正厅', count: 1 }, { title: '人大副主任', rank: '副厅', count: 2 },
    { title: '法制处处长', rank: '正处', count: 1 }, { title: '监督处处长', rank: '正处', count: 1 },
    { title: '代表处处长', rank: '正处', count: 1 }, { title: '调研处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 },
    { title: '三处副处长', rank: '副处', count: 2 }, { title: '四处副处长', rank: '副处', count: 2 }
  ]},
  cppcc: { id: 'cppcc', name: '政协', type: 'other', positions: [
    { title: '政协主席', rank: '正厅', count: 1 }, { title: '政协副主席', rank: '副厅', count: 2 },
    { title: '提案处处长', rank: '正处', count: 1 }, { title: '文史处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 }
  ]},
  procuratorate: { id: 'procuratorate', name: '检察院', type: 'other', positions: [
    { title: '检察长', rank: '正厅', count: 1 }, { title: '副检察长', rank: '副厅', count: 2 },
    { title: '一处处长', rank: '正处', count: 1 }, { title: '二处处长', rank: '正处', count: 1 },
    { title: '一处副处长', rank: '副处', count: 2 }, { title: '二处副处长', rank: '副处', count: 2 }
  ]}
};

export function getDeptResourceType(deptId) { return deptId; }
export function isGovernmentDept(deptId) { const d = DEPARTMENTS[deptId]; return d && d.type === 'government'; }
export function isPartyDept(deptId) { const d = DEPARTMENTS[deptId]; return d && d.type === 'party'; }
